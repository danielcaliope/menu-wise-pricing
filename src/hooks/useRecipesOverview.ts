import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateRecipeCost } from "@/domain/pricing";
import { useRecipes } from "./useRecipes";
import { useRecipeIndirectCosts } from "./useRecipeIndirectCosts";

export type RecipeOverview = {
  recipeId: string;
  name: string;
  totalCost: number;
  ingredientCount: number;
  lastRecipeCost: number | null;
  lastSuggestedPrice: number | null;
  // % de variação do custo atual vs. o último preço salvo em pricing_history
  // (null se a receita nunca foi precificada — não há o que comparar).
  costChangePercentage: number | null;
};

type RecipeIngredientRow = {
  recipe_id: string;
  quantity: number;
  ingredients: { unit_cost: number } | null;
};

type LatestPricingRow = {
  recipe_id: string;
  recipe_cost: number;
  suggested_price: number;
  created_at: string;
};

async function fetchRecipeIngredientsBulk(recipeIds: string[]): Promise<RecipeIngredientRow[]> {
  if (recipeIds.length === 0) return [];

  const { data, error } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id, quantity, ingredients (unit_cost)")
    .in("recipe_id", recipeIds);

  if (error) throw error;
  return (data as unknown as RecipeIngredientRow[]) ?? [];
}

async function fetchLatestPricingPerRecipe(userId: string): Promise<Map<string, LatestPricingRow>> {
  const { data, error } = await supabase
    .from("pricing_history")
    .select("recipe_id, recipe_cost, suggested_price, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Mantém só a linha mais recente por receita (dados já vêm ordenados desc).
  const latestByRecipe = new Map<string, LatestPricingRow>();
  for (const row of data ?? []) {
    if (!latestByRecipe.has(row.recipe_id)) {
      latestByRecipe.set(row.recipe_id, row as LatestPricingRow);
    }
  }
  return latestByRecipe;
}

export function useRecipesOverview() {
  const { recipes, isLoading: loadingRecipes } = useRecipes();
  const { recipeIndirectCosts, isLoading: loadingIndirectCosts } = useRecipeIndirectCosts();

  const recipeIds = useMemo(() => recipes.map((r) => r.id), [recipes]);

  const { data: ingredientRows, isLoading: loadingIngredientRows } = useQuery({
    queryKey: ["recipes-overview-ingredients", recipeIds],
    queryFn: () => fetchRecipeIngredientsBulk(recipeIds),
  });

  const { data: latestPricing, isLoading: loadingPricing } = useQuery({
    queryKey: ["recipes-overview-latest-pricing"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Map<string, LatestPricingRow>();
      return fetchLatestPricingPerRecipe(user.id);
    },
  });

  const overview = useMemo<RecipeOverview[]>(() => {
    if (!ingredientRows || !latestPricing) return [];

    const ingredientsByRecipe = new Map<string, RecipeIngredientRow[]>();
    for (const row of ingredientRows) {
      const list = ingredientsByRecipe.get(row.recipe_id) ?? [];
      list.push(row);
      ingredientsByRecipe.set(row.recipe_id, list);
    }

    const indirectCostsByRecipe = new Map<string, number[]>();
    for (const cost of recipeIndirectCosts) {
      const list = indirectCostsByRecipe.get(cost.recipe_id) ?? [];
      list.push(Number(cost.amount));
      indirectCostsByRecipe.set(cost.recipe_id, list);
    }

    return recipes.map((recipe) => {
      const ingredientLines = (ingredientsByRecipe.get(recipe.id) ?? []).map((row) => ({
        quantity: row.quantity,
        unitCost: row.ingredients?.unit_cost ?? 0,
      }));
      const indirectCosts = indirectCostsByRecipe.get(recipe.id) ?? [];

      const { totalCost } = calculateRecipeCost({
        ingredients: ingredientLines,
        wastePercentage: recipe.waste_percentage,
        indirectCosts,
      });

      const lastPricing = latestPricing.get(recipe.id) ?? null;
      const costChangePercentage = lastPricing && lastPricing.recipe_cost > 0
        ? ((totalCost - Number(lastPricing.recipe_cost)) / Number(lastPricing.recipe_cost)) * 100
        : null;

      return {
        recipeId: recipe.id,
        name: recipe.name,
        totalCost,
        ingredientCount: ingredientLines.length,
        lastRecipeCost: lastPricing ? Number(lastPricing.recipe_cost) : null,
        lastSuggestedPrice: lastPricing ? Number(lastPricing.suggested_price) : null,
        costChangePercentage,
      };
    });
  }, [recipes, ingredientRows, recipeIndirectCosts, latestPricing]);

  return {
    overview,
    isLoading: loadingRecipes || loadingIndirectCosts || loadingIngredientRows || loadingPricing,
  };
}
