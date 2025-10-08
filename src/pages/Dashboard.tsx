import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ChefHat, DollarSign, TrendingUp, PieChart as PieChartIcon, AlertTriangle, Bell, Calendar, BarChart3, Target } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StatsSkeleton } from "@/components/SkeletonLoader";
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type Stats = {
  totalIngredients: number;
  totalRecipes: number;
  averageCost: number;
  totalPricings: number;
  lowStockCount: number;
  unreadAlerts: number;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalIngredients: 0,
    totalRecipes: 0,
    averageCost: 0,
    totalPricings: 0,
    lowStockCount: 0,
    unreadAlerts: 0,
  });
  const [topRecipes, setTopRecipes] = useState<any[]>([]);
  const [costTrends, setCostTrends] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [pricingTrends, setPricingTrends] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [mostUsedIngredients, setMostUsedIngredients] = useState<any[]>([]);
  const [profitabilityAnalysis, setProfitabilityAnalysis] = useState<any[]>([]);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    await Promise.all([
      fetchUserProfile(session.user.id),
      fetchDashboardStats(session.user.id),
      fetchTopRecipes(session.user.id),
      fetchCostTrends(session.user.id),
      fetchRecentAlerts(session.user.id),
      fetchPricingTrends(session.user.id),
      fetchCategoryDistribution(session.user.id),
      fetchMostUsedIngredients(session.user.id),
      fetchProfitabilityAnalysis(session.user.id),
    ]);
    setLoading(false);
  };

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    
    if (data) {
      setUserName(data.full_name || "Usuário");
    }
  };

  const fetchDashboardStats = async (userId: string) => {
    // Count ingredients
    const { count: ingredientsCount } = await supabase
      .from("ingredients")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Count recipes
    const { count: recipesCount } = await supabase
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Count pricing history
    const { count: pricingsCount } = await supabase
      .from("pricing_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Calculate average ingredient cost
    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("unit_cost")
      .eq("user_id", userId);

    const avgCost = ingredients?.length
      ? ingredients.reduce((sum, ing) => sum + Number(ing.unit_cost), 0) / ingredients.length
      : 0;

    // Count low stock items
    const { data: stock } = await supabase
      .from("ingredient_stock")
      .select("current_quantity, min_quantity")
      .eq("user_id", userId);
    
    const lowStock = stock?.filter(s => s.current_quantity <= s.min_quantity).length || 0;

    // Count unread alerts
    const { count: unreadCount } = await supabase
      .from("cost_alert_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    setStats({
      totalIngredients: ingredientsCount || 0,
      totalRecipes: recipesCount || 0,
      averageCost: avgCost,
      totalPricings: pricingsCount || 0,
      lowStockCount: lowStock,
      unreadAlerts: unreadCount || 0,
    });
  };

  const fetchTopRecipes = async (userId: string) => {
    const { data: pricingData } = await supabase
      .from("pricing_history")
      .select("recipe_name, suggested_price, recipe_cost, profit_margin_percentage")
      .eq("user_id", userId)
      .order("suggested_price", { ascending: false })
      .limit(5);

    if (pricingData) {
      const recipes = pricingData.map(item => ({
        name: item.recipe_name,
        price: Number(item.suggested_price),
        cost: Number(item.recipe_cost),
        profit: Number(item.suggested_price) - Number(item.recipe_cost),
        margin: Number(item.profit_margin_percentage),
      }));
      setTopRecipes(recipes);
    }
  };

  const fetchCostTrends = async (userId: string) => {
    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("name, unit_cost")
      .eq("user_id", userId)
      .order("unit_cost", { ascending: false })
      .limit(6);

    if (ingredients) {
      setCostTrends(
        ingredients.map(ing => ({
          name: ing.name.substring(0, 10),
          cost: Number(ing.unit_cost),
        }))
      );
    }
  };

  const fetchRecentAlerts = async (userId: string) => {
    const { data } = await supabase
      .from("cost_alert_history")
      .select("*")
      .eq("user_id", userId)
      .order("triggered_at", { ascending: false })
      .limit(5);

    if (data) {
      setRecentAlerts(data);
    }
  };

  const fetchPricingTrends = async (userId: string) => {
    const { data } = await supabase
      .from("pricing_history")
      .select("created_at, suggested_price, recipe_cost")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(30);

    if (data && data.length > 0) {
      const trends = data.map(item => ({
        date: format(new Date(item.created_at), "dd/MM", { locale: ptBR }),
        preco: Number(item.suggested_price),
        custo: Number(item.recipe_cost),
      }));
      setPricingTrends(trends);
    }
  };

  const fetchCategoryDistribution = async (userId: string) => {
    const { data: recipes } = await supabase
      .from("recipes")
      .select("category_id, categories(name)")
      .eq("user_id", userId);

    if (recipes) {
      const categoryCount: Record<string, number> = {};
      recipes.forEach((recipe: any) => {
        const categoryName = recipe.categories?.name || "Sem categoria";
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
      });

      const distribution = Object.entries(categoryCount).map(([name, value]) => ({
        name,
        value,
      }));
      setCategoryDistribution(distribution);
    }
  };

  const fetchMostUsedIngredients = async (userId: string) => {
    const { data } = await supabase
      .from("recipe_ingredients")
      .select(`
        ingredient_id,
        ingredients!inner(name, user_id)
      `)
      .eq("ingredients.user_id", userId);

    if (data) {
      const ingredientCount: Record<string, { name: string; count: number }> = {};
      data.forEach((ri: any) => {
        const id = ri.ingredient_id;
        const name = ri.ingredients?.name;
        if (name) {
          if (!ingredientCount[id]) {
            ingredientCount[id] = { name, count: 0 };
          }
          ingredientCount[id].count++;
        }
      });

      const mostUsed = Object.values(ingredientCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map(item => ({
          name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
          receitas: item.count,
        }));
      
      setMostUsedIngredients(mostUsed);
    }
  };

  const fetchProfitabilityAnalysis = async (userId: string) => {
    const { data } = await supabase
      .from("pricing_history")
      .select("recipe_name, suggested_price, recipe_cost, profit_margin_percentage")
      .eq("user_id", userId);

    if (data && data.length > 0) {
      const recipeStats: Record<string, { name: string; avgPrice: number; avgCost: number; avgMargin: number; count: number }> = {};
      
      data.forEach((item: any) => {
        const name = item.recipe_name;
        if (!recipeStats[name]) {
          recipeStats[name] = { name, avgPrice: 0, avgCost: 0, avgMargin: 0, count: 0 };
        }
        recipeStats[name].avgPrice += Number(item.suggested_price);
        recipeStats[name].avgCost += Number(item.recipe_cost);
        recipeStats[name].avgMargin += Number(item.profit_margin_percentage);
        recipeStats[name].count++;
      });

      const analysis = Object.values(recipeStats)
        .map(stat => ({
          name: stat.name.length > 12 ? stat.name.substring(0, 12) + "..." : stat.name,
          fullName: stat.name,
          custo: stat.avgCost / stat.count,
          preco: stat.avgPrice / stat.count,
          margem: stat.avgMargin / stat.count,
          lucro: (stat.avgPrice - stat.avgCost) / stat.count,
        }))
        .sort((a, b) => b.lucro - a.lucro)
        .slice(0, 8);
      
      setProfitabilityAnalysis(analysis);
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B9D", "#C084FC"];

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <Breadcrumbs items={[{ label: "Dashboard" }]} />
          <StatsSkeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
        
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Olá, {userName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de controle
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Ingredientes
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalIngredients}</div>
              <p className="text-xs text-muted-foreground">
                Cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receitas Criadas
              </CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecipes}</div>
              <p className="text-xs text-muted-foreground">
                Fichas técnicas completas
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Custo Médio
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.averageCost.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por ingrediente
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Precificações
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPricings}</div>
              <p className="text-xs text-muted-foreground">
                Cálculos realizados
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Itens em Falta
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStockCount}</div>
              <p className="text-xs text-muted-foreground">
                Estoque abaixo do mínimo
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Alertas Novos
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unreadAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Não lidos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        {recentAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Alertas Recentes
                  </CardTitle>
                  <CardDescription>
                    Últimas notificações de variação de custos
                  </CardDescription>
                </div>
                <Button onClick={() => navigate("/cost-alerts")} variant="outline" size="sm">
                  Ver Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start justify-between p-3 rounded-lg border ${
                      alert.is_read ? 'bg-background' : 'bg-muted/50'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{alert.reference_name}</p>
                        <Badge
                          variant={alert.percentage_change > 0 ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {alert.percentage_change > 0 ? '+' : ''}
                          {alert.percentage_change.toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        De R$ {Number(alert.old_value).toFixed(2)} para R$ {Number(alert.new_value).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(alert.triggered_at), "PPp", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Analytics with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análises Avançadas
            </CardTitle>
            <CardDescription>
              Visualize diferentes aspectos do seu negócio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trends" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-4">
                <TabsTrigger value="trends">Tendências</TabsTrigger>
                <TabsTrigger value="profitability">Rentabilidade</TabsTrigger>
                <TabsTrigger value="categories">Categorias</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
                <TabsTrigger value="comparison">Comparação</TabsTrigger>
              </TabsList>

              <TabsContent value="trends" className="mt-0">
                {pricingTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={pricingTrends}>
                      <defs>
                        <linearGradient id="colorPreco" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF8042" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FF8042" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="preco" 
                        stroke="#0088FE" 
                        fillOpacity={1}
                        fill="url(#colorPreco)" 
                        name="Preço Sugerido"
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="custo" 
                        stroke="#FF8042" 
                        fillOpacity={1}
                        fill="url(#colorCusto)" 
                        name="Custo"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="mb-2">Salve precificações para ver tendências</p>
                      <Button onClick={() => navigate("/pricing")} size="sm">
                        Ir para Precificação
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="profitability" className="mt-0">
                {profitabilityAnalysis.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={profitabilityAnalysis} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === "Margem (%)") return `${value.toFixed(1)}%`;
                          return `R$ ${value.toFixed(2)}`;
                        }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar dataKey="lucro" fill="#00C49F" name="Lucro (R$)" />
                      <Bar dataKey="margem" fill="#8884D8" name="Margem (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    <div className="text-center">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="mb-2">Dados insuficientes para análise</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="categories" className="mt-0">
                {categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <RePieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${value} receitas`}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    <div className="text-center">
                      <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="mb-2">Crie receitas com categorias</p>
                      <Button onClick={() => navigate("/recipes")} size="sm">
                        Criar Receitas
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ingredients" className="mt-0">
                {mostUsedIngredients.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={mostUsedIngredients}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => `Usado em ${value} receitas`}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="receitas" fill="#FFBB28" name="Número de Receitas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    <div className="text-center">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="mb-2">Adicione ingredientes às receitas</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comparison" className="mt-0">
                {topRecipes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={topRecipes.slice(0, 5)}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
                      <Radar 
                        name="Preço (R$)" 
                        dataKey="price" 
                        stroke="#0088FE" 
                        fill="#0088FE" 
                        fillOpacity={0.6}
                      />
                      <Radar 
                        name="Custo (R$)" 
                        dataKey="cost" 
                        stroke="#FF8042" 
                        fill="#FF8042" 
                        fillOpacity={0.6}
                      />
                      <Legend />
                      <Tooltip 
                        formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="mb-2">Precifique receitas para comparar</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Additional insights row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Cost Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Distribuição de Custos
              </CardTitle>
              <CardDescription>
                Ingredientes com maiores custos unitários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {costTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={costTrends}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => 
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="cost"
                    >
                      {costTrends.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="mb-2">Cadastre ingredientes para ver a distribuição</p>
                    <Button onClick={() => navigate("/ingredients")} size="sm">
                      Cadastrar Ingredientes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Recipes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Receitas
              </CardTitle>
              <CardDescription>
                Receitas com maior preço sugerido
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topRecipes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topRecipes}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={90}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="price" fill="hsl(var(--primary))" name="Preço Sugerido" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="cost" fill="hsl(var(--accent))" name="Custo" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="mb-2">Nenhuma precificação salva ainda</p>
                    <Button onClick={() => navigate("/pricing")} size="sm">
                      Começar Precificação
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button 
              onClick={() => navigate("/ingredients")} 
              className="gap-2 h-auto py-4"
              variant="outline"
            >
              <Package className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Ingredientes</div>
                <div className="text-xs text-muted-foreground">{stats.totalIngredients} cadastrados</div>
              </div>
            </Button>
            <Button 
              onClick={() => navigate("/recipes")} 
              className="gap-2 h-auto py-4"
              variant="outline"
            >
              <ChefHat className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Receitas</div>
                <div className="text-xs text-muted-foreground">{stats.totalRecipes} criadas</div>
              </div>
            </Button>
            <Button 
              onClick={() => navigate("/pricing")} 
              className="gap-2 h-auto py-4"
              variant="outline"
            >
              <DollarSign className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Precificação</div>
                <div className="text-xs text-muted-foreground">{stats.totalPricings} cálculos</div>
              </div>
            </Button>
            <Button 
              onClick={() => navigate("/settings")} 
              className="gap-2 h-auto py-4"
              variant="outline"
            >
              <TrendingUp className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Configurações</div>
                <div className="text-xs text-muted-foreground">Personalize</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
