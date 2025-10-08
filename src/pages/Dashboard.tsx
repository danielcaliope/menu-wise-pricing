import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ChefHat, DollarSign, TrendingUp, PieChart as PieChartIcon, AlertTriangle, Bell } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StatsSkeleton } from "@/components/SkeletonLoader";
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
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

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

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

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Top Recipes Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Receitas por Preço
              </CardTitle>
              <CardDescription>
                Suas receitas com maior valor sugerido
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topRecipes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topRecipes}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="price" fill="hsl(var(--primary))" name="Preço Sugerido" />
                    <Bar dataKey="cost" fill="hsl(var(--accent))" name="Custo" />
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

          {/* Cost Distribution Pie Chart */}
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
                      labelLine={false}
                      label={({ name, percent }) => 
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
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
        </div>

        {/* Profit Analysis */}
        {topRecipes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Análise de Rentabilidade
              </CardTitle>
              <CardDescription>
                Margem de lucro das suas receitas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={topRecipes}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => 
                      typeof value === 'number' && value < 100 
                        ? `${value.toFixed(1)}%` 
                        : `R$ ${value.toFixed(2)}`
                    }
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#00C49F" 
                    name="Lucro por Venda (R$)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="margin" 
                    stroke="#FF8042" 
                    name="Margem (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

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
