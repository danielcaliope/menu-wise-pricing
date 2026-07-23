import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { recipeIngredientKeys } from "./queryKeys";

export type RecipeIngredientRow = {
  id: string;
  ingredient_id: string;
  quantity: number;
  ingredients: { id: string; name: string; unit: string; unit_cost: number };
};

export function useRecipeIngredients(recipeId: string | null) {
  const query = useQuery({
    queryKey: recipeIngredientKeys.detail(recipeId),
    queryFn: async (): Promise<RecipeIngredientRow[]> => {
      if (!recipeId) return [];

      const { data, error } = await supabase
        .from("recipe_ingredients")
        .select(`
          id,
          ingredient_id,
          quantity,
          ingredients (id, name, unit, unit_cost)
        `)
        .eq("recipe_id", recipeId);

      if (error) throw error;
      return (data as unknown as RecipeIngredientRow[]) ?? [];
    },
    enabled: !!recipeId,
  });

  return {
    recipeIngredients: query.data ?? [],
    isLoading: query.isLoading,
  };
}
