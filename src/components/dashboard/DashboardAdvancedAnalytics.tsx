import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Package, ChefHat, TrendingUp, PieChart as PieChartIcon, Calendar, BarChart3, Target, ChevronDown,
} from "lucide-react";
import {
  LineChart, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B9D", "#C084FC"];

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function fetchTopRecipes() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("pricing_history")
    .select("recipe_name, suggested_price, recipe_cost, profit_margin_percentage")
    .eq("user_id", userId)
    .order("suggested_price", { ascending: false })
    .limit(5);
  return (data ?? []).map((item) => ({
    name: item.recipe_name,
    price: Number(item.suggested_price),
    cost: Number(item.recipe_cost),
  }));
}

async function fetchCostTrends() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("ingredients")
    .select("name, unit_cost")
    .eq("user_id", userId)
    .order("unit_cost", { ascending: false })
    .limit(6);
  return (data ?? []).map((ing) => ({ name: ing.name.substring(0, 10), cost: Number(ing.unit_cost) }));
}

async function fetchPricingTrends() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("pricing_history")
    .select("created_at, suggested_price, recipe_cost")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(30);
  return (data ?? []).map((item) => ({
    date: format(new Date(item.created_at), "dd/MM", { locale: ptBR }),
    preco: Number(item.suggested_price),
    custo: Number(item.recipe_cost),
  }));
}

async function fetchCategoryDistribution() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("recipes")
    .select("category_id, categories(name)")
    .eq("user_id", userId);
  const counts: Record<string, number> = {};
  type CategoryRow = { category_id: string | null; categories: { name: string } | null };
  ((data ?? []) as unknown as CategoryRow[]).forEach((recipe) => {
    const name = recipe.categories?.name || "Sem categoria";
    counts[name] = (counts[name] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

async function fetchMostUsedIngredients() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("recipe_ingredients")
    .select("ingredient_id, ingredients!inner(name, user_id)")
    .eq("ingredients.user_id", userId);
  const counts: Record<string, { name: string; count: number }> = {};
  type IngredientUsageRow = { ingredient_id: string; ingredients: { name: string; user_id: string } | null };
  ((data ?? []) as unknown as IngredientUsageRow[]).forEach((ri) => {
    const name = ri.ingredients?.name;
    if (!name) return;
    counts[ri.ingredient_id] ??= { name, count: 0 };
    counts[ri.ingredient_id].count++;
  });
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item) => ({ name: item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name, receitas: item.count }));
}

async function fetchProfitabilityAnalysis() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("pricing_history")
    .select("recipe_name, suggested_price, recipe_cost, profit_margin_percentage")
    .eq("user_id", userId);
  const stats: Record<string, { name: string; avgPrice: number; avgCost: number; avgMargin: number; count: number }> = {};
  (data ?? []).forEach((item) => {
    stats[item.recipe_name] ??= { name: item.recipe_name, avgPrice: 0, avgCost: 0, avgMargin: 0, count: 0 };
    const s = stats[item.recipe_name];
    s.avgPrice += Number(item.suggested_price);
    s.avgCost += Number(item.recipe_cost);
    s.avgMargin += Number(item.profit_margin_percentage);
    s.count++;
  });
  return Object.values(stats)
    .map((s) => ({
      name: s.name.length > 12 ? `${s.name.substring(0, 12)}...` : s.name,
      custo: s.avgCost / s.count,
      preco: s.avgPrice / s.count,
      margem: s.avgMargin / s.count,
      lucro: (s.avgPrice - s.avgCost) / s.count,
    }))
    .sort((a, b) => b.lucro - a.lucro)
    .slice(0, 8);
}

// Análises históricas mais profundas — secundárias ao dia a dia do Dashboard,
// por isso ficam recolhidas por padrão e só buscam dados quando abertas.
export function DashboardAdvancedAnalytics() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: topRecipes = [] } = useQuery({ queryKey: ["adv-top-recipes"], queryFn: fetchTopRecipes, enabled: open });
  const { data: costTrends = [] } = useQuery({ queryKey: ["adv-cost-trends"], queryFn: fetchCostTrends, enabled: open });
  const { data: pricingTrends = [] } = useQuery({ queryKey: ["adv-pricing-trends"], queryFn: fetchPricingTrends, enabled: open });
  const { data: categoryDistribution = [] } = useQuery({ queryKey: ["adv-category-distribution"], queryFn: fetchCategoryDistribution, enabled: open });
  const { data: mostUsedIngredients = [] } = useQuery({ queryKey: ["adv-most-used-ingredients"], queryFn: fetchMostUsedIngredients, enabled: open });
  const { data: profitabilityAnalysis = [] } = useQuery({ queryKey: ["adv-profitability"], queryFn: fetchProfitabilityAnalysis, enabled: open });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none">
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análises Avançadas
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </CardTitle>
            <CardDescription>Histórico detalhado de preços, categorias e ingredientes</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
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
                          <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF8042" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#FF8042" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                      <Area type="monotone" dataKey="preco" stroke="#0088FE" fillOpacity={1} fill="url(#colorPreco)" name="Preço Sugerido" strokeWidth={2} />
                      <Area type="monotone" dataKey="custo" stroke="#FF8042" fillOpacity={1} fill="url(#colorCusto)" name="Custo" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="mb-2">Salve precificações para ver tendências</p>
                      <Button onClick={() => navigate("/pricing")} size="sm">Ir para Precificação</Button>
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
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number, name: string) => (name === "Margem (%)" ? `${value.toFixed(1)}%` : `R$ ${value.toFixed(2)}`)} />
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
                      <Pie data={categoryDistribution} cx="50%" cy="50%" labelLine label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                        {categoryDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value} receitas`} />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                    <div className="text-center">
                      <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="mb-2">Crie receitas com categorias</p>
                      <Button onClick={() => navigate("/recipes")} size="sm">Criar Receitas</Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ingredients" className="mt-0">
                {mostUsedIngredients.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={mostUsedIngredients}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={100} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => `Usado em ${value} receitas`} />
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
                      <PolarRadiusAxis angle={90} domain={[0, "auto"]} />
                      <Radar name="Preço (R$)" dataKey="price" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
                      <Radar name="Custo (R$)" dataKey="cost" stroke="#FF8042" fill="#FF8042" fillOpacity={0.6} />
                      <Legend />
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
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

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Distribuição de Custos
                  </CardTitle>
                  <CardDescription>Ingredientes com maiores custos unitários</CardDescription>
                </CardHeader>
                <CardContent>
                  {costTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie data={costTrends} cx="50%" cy="50%" labelLine label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={90} fill="#8884d8" dataKey="cost">
                          {costTrends.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <div className="text-center">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="mb-2">Cadastre ingredientes para ver a distribuição</p>
                        <Button onClick={() => navigate("/ingredients")} size="sm">Cadastrar Ingredientes</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Receitas
                  </CardTitle>
                  <CardDescription>Receitas com maior preço sugerido</CardDescription>
                </CardHeader>
                <CardContent>
                  {topRecipes.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topRecipes}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={90} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
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
                        <Button onClick={() => navigate("/pricing")} size="sm">Começar Precificação</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
