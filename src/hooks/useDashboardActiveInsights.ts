import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useRecipesOverview } from "./useRecipesOverview";

const RECENT_WINDOW_DAYS = 30;
// Mesmo limiar já usado em WeeklyInsights.tsx pra "margem baixa" — aqui
// aplicado por receita (margem realizada de vendas), não ao negócio inteiro.
const CRITICAL_MARGIN_THRESHOLD = 20;
// Mesmo default já usado em CostAlerts.tsx quando o usuário não configurou
// um limiar próprio pro tipo de alerta "recipe_cost_increase".
const DEFAULT_COST_INCREASE_THRESHOLD = 10;
const MAX_ITEMS_PER_CATEGORY = 5;

export type CriticalMarginItem = { recipeId: string; name: string; marginPercentage: number };
export type IngredientCostAlertItem = { name: string; percentageChange: number; oldValue: number; newValue: number };
export type BelowMinimumSaleItem = { recipeName: string; loss: number; saleDate: string };
export type LowStockItem = { name: string; currentQuantity: number; minQuantity: number; unit: string };
export type RepricingOpportunityItem = { recipeId: string; name: string; costChangePercentage: number };
export type MostProfitableRecipe = { recipeId: string; name: string; profit: number } | null;

type SaleByRecipeRow = {
  recipe_id: string;
  final_price: number | null;
  total_amount: number | null;
  total_cost: number | null;
  profit: number | null;
  recipes: { name: string } | null;
};

async function fetchSalesByRecipe(userId: string, since: Date) {
  const { data, error } = await supabase
    .from("sales")
    .select("recipe_id, final_price, total_amount, total_cost, profit, recipes(name)")
    .eq("user_id", userId)
    .gte("sale_date", since.toISOString());

  if (error) throw error;

  const byRecipe = new Map<string, { name: string; revenue: number; cost: number; profit: number }>();
  for (const sale of (data ?? []) as unknown as SaleByRecipeRow[]) {
    const recipeId = sale.recipe_id;
    const name = sale.recipes?.name;
    if (!recipeId || !name) continue;

    const entry = byRecipe.get(recipeId) ?? { name, revenue: 0, cost: 0, profit: 0 };
    entry.revenue += Number(sale.final_price ?? sale.total_amount ?? 0);
    entry.cost += Number(sale.total_cost ?? 0);
    entry.profit += Number(sale.profit ?? 0);
    byRecipe.set(recipeId, entry);
  }

  return Array.from(byRecipe.entries()).map(([recipeId, v]) => ({
    recipeId,
    name: v.name,
    revenue: v.revenue,
    cost: v.cost,
    profit: v.profit,
    marginPercentage: v.revenue > 0 ? (v.profit / v.revenue) * 100 : 0,
  }));
}

type BelowMinimumSaleRow = { profit: number; sale_date: string; recipes: { name: string } | null };

async function fetchBelowMinimumSales(userId: string, since: Date): Promise<BelowMinimumSaleItem[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("profit, sale_date, recipes(name)")
    .eq("user_id", userId)
    .gte("sale_date", since.toISOString())
    .lt("profit", 0)
    .order("sale_date", { ascending: false })
    .limit(MAX_ITEMS_PER_CATEGORY);

  if (error) throw error;
  return ((data ?? []) as unknown as BelowMinimumSaleRow[])
    .filter((s) => s.recipes?.name)
    .map((s) => ({ recipeName: s.recipes!.name, loss: Number(s.profit), saleDate: s.sale_date }));
}

type LowStockRow = {
  current_quantity: number;
  min_quantity: number;
  ingredients: { name: string; unit: string } | null;
};

async function fetchLowStock(userId: string): Promise<LowStockItem[]> {
  const { data, error } = await supabase
    .from("ingredient_stock")
    .select("current_quantity, min_quantity, ingredients(name, unit)")
    .eq("user_id", userId);

  if (error) throw error;
  return ((data ?? []) as unknown as LowStockRow[])
    .filter((s) => s.current_quantity < s.min_quantity && s.ingredients?.name)
    .slice(0, MAX_ITEMS_PER_CATEGORY)
    .map((s) => ({
      name: s.ingredients!.name,
      currentQuantity: Number(s.current_quantity),
      minQuantity: Number(s.min_quantity),
      unit: s.ingredients!.unit,
    }));
}

async function fetchIngredientCostAlerts(userId: string): Promise<{ enabled: boolean; items: IngredientCostAlertItem[] }> {
  const { data: config, error: configError } = await supabase
    .from("cost_alerts")
    .select("enabled")
    .eq("user_id", userId)
    .eq("alert_type", "ingredient_price_increase")
    .maybeSingle();

  if (configError) throw configError;
  const enabled = !!config?.enabled;
  if (!enabled) return { enabled: false, items: [] };

  const { data, error } = await supabase
    .from("cost_alert_history")
    .select("reference_name, percentage_change, old_value, new_value")
    .eq("user_id", userId)
    .eq("alert_type", "ingredient_price_increase")
    .eq("is_read", false)
    .order("triggered_at", { ascending: false })
    .limit(MAX_ITEMS_PER_CATEGORY);

  if (error) throw error;
  return {
    enabled: true,
    items: (data ?? []).map((a) => ({
      name: a.reference_name,
      percentageChange: Number(a.percentage_change),
      oldValue: Number(a.old_value),
      newValue: Number(a.new_value),
    })),
  };
}

async function fetchRecipeCostIncreaseThreshold(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("cost_alerts")
    .select("threshold_percentage")
    .eq("user_id", userId)
    .eq("alert_type", "recipe_cost_increase")
    .maybeSingle();

  if (error) throw error;
  return data?.threshold_percentage ?? DEFAULT_COST_INCREASE_THRESHOLD;
}

type MonthlyTrend = { revenueChange: number; profitChange: number } | null;

async function fetchMonthlyTrend(userId: string): Promise<MonthlyTrend> {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    { data: currentMonth, error: currentMonthError },
    { data: lastMonth, error: lastMonthError },
  ] = await Promise.all([
    supabase.from("sales").select("final_price, total_amount, profit").eq("user_id", userId)
      .gte("sale_date", currentMonthStart.toISOString()),
    supabase.from("sales").select("final_price, total_amount, profit").eq("user_id", userId)
      .gte("sale_date", lastMonthStart.toISOString()).lte("sale_date", lastMonthEnd.toISOString()),
  ]);

  if (currentMonthError) throw currentMonthError;
  if (lastMonthError) throw lastMonthError;

  type MonthSaleRow = { final_price: number | null; total_amount: number | null; profit: number | null };
  const sumProfit = (rows: MonthSaleRow[] | null) =>
    rows?.reduce((acc, r) => acc + Number(r.profit ?? 0), 0) ?? 0;
  const sumRevenue = (rows: MonthSaleRow[] | null) =>
    rows?.reduce((acc, r) => acc + Number(r.final_price ?? r.total_amount ?? 0), 0) ?? 0;

  const currentRevenue = sumRevenue(currentMonth);
  const lastRevenue = sumRevenue(lastMonth);
  const currentProfit = sumProfit(currentMonth);
  const lastProfit = sumProfit(lastMonth);

  return {
    revenueChange: lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0,
    profitChange: lastProfit > 0 ? ((currentProfit - lastProfit) / lastProfit) * 100 : 0,
  };
}

export function useDashboardActiveInsights() {
  const { overview, isLoading: loadingOverview } = useRecipesOverview();
  const since = useMemo(() => subDays(new Date(), RECENT_WINDOW_DAYS), []);

  const { data: salesByRecipe, isLoading: loadingSalesByRecipe } = useQuery({
    queryKey: ["dashboard-sales-by-recipe"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      return fetchSalesByRecipe(user.id, since);
    },
  });

  const { data: belowMinimumSales, isLoading: loadingBelowMinimum } = useQuery({
    queryKey: ["dashboard-below-minimum-sales"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      return fetchBelowMinimumSales(user.id, since);
    },
  });

  const { data: lowStock, isLoading: loadingLowStock } = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      return fetchLowStock(user.id);
    },
  });

  const { data: ingredientAlerts, isLoading: loadingIngredientAlerts } = useQuery({
    queryKey: ["dashboard-ingredient-cost-alerts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { enabled: false, items: [] as IngredientCostAlertItem[] };
      return fetchIngredientCostAlerts(user.id);
    },
  });

  const { data: repricingThreshold, isLoading: loadingThreshold } = useQuery({
    queryKey: ["dashboard-recipe-cost-increase-threshold"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULT_COST_INCREASE_THRESHOLD;
      return fetchRecipeCostIncreaseThreshold(user.id);
    },
  });

  const { data: monthlyTrend, isLoading: loadingMonthlyTrend } = useQuery({
    queryKey: ["dashboard-monthly-trend"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return fetchMonthlyTrend(user.id);
    },
  });

  const criticalMargin: CriticalMarginItem[] = useMemo(() => {
    return (salesByRecipe ?? [])
      .filter((r) => r.marginPercentage < CRITICAL_MARGIN_THRESHOLD)
      .sort((a, b) => a.marginPercentage - b.marginPercentage)
      .slice(0, MAX_ITEMS_PER_CATEGORY)
      .map((r) => ({ recipeId: r.recipeId, name: r.name, marginPercentage: r.marginPercentage }));
  }, [salesByRecipe]);

  const mostProfitable: MostProfitableRecipe = useMemo(() => {
    if (!salesByRecipe || salesByRecipe.length === 0) return null;
    const top = [...salesByRecipe].sort((a, b) => b.profit - a.profit)[0];
    return { recipeId: top.recipeId, name: top.name, profit: top.profit };
  }, [salesByRecipe]);

  const repricingOpportunities: RepricingOpportunityItem[] = useMemo(() => {
    const threshold = repricingThreshold ?? DEFAULT_COST_INCREASE_THRESHOLD;
    return overview
      .filter((r) => r.costChangePercentage !== null && r.costChangePercentage >= threshold)
      .sort((a, b) => (b.costChangePercentage ?? 0) - (a.costChangePercentage ?? 0))
      .slice(0, MAX_ITEMS_PER_CATEGORY)
      .map((r) => ({ recipeId: r.recipeId, name: r.name, costChangePercentage: r.costChangePercentage as number }));
  }, [overview, repricingThreshold]);

  const incompleteRecipes = useMemo(
    () => overview.filter((r) => r.ingredientCount === 0),
    [overview],
  );

  return {
    isLoading: loadingOverview || loadingSalesByRecipe || loadingBelowMinimum || loadingLowStock ||
      loadingIngredientAlerts || loadingThreshold || loadingMonthlyTrend,
    criticalMargin,
    ingredientCostAlerts: ingredientAlerts ?? { enabled: false, items: [] },
    belowMinimumSales: belowMinimumSales ?? [],
    lowStock: lowStock ?? [],
    mostProfitable,
    repricingOpportunities,
    monthlyTrend: monthlyTrend ?? null,
    incompleteRecipes,
  };
}
