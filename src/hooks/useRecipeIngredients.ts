import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RecipeIngredientRow = {
  id: string;
  ingredient_id: string;
  quantity: number;
  ingredients: { id: string; name: string; unit: string; unit_cost: number };
};

export function useRecipeIngredients(recipeId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["recipe-ingredients", recipeId],
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

  const addIngredient = useMutation({
    mutationFn: async ({ recipeId, ingredientId, quantity }: { recipeId: string; ingredientId: string; quantity: number }) => {
      const { error } = await supabase
        .from("recipe_ingredients")
        .insert([{ recipe_id: recipeId, ingredient_id: ingredientId, quantity }]);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipe-ingredients", variables.recipeId] });
    },
  });

  const removeIngredient = useMutation({
    mutationFn: async ({ id }: { id: string; recipeId: string }) => {
      const { error } = await supabase.from("recipe_ingredients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipe-ingredients", variables.recipeId] });
    },
  });

  return {
    recipeIngredients: query.data ?? [],
    isLoading: query.isLoading,
    addIngredient,
    removeIngredient,
  };
}
