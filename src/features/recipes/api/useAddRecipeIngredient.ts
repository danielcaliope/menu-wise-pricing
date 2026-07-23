import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { recipeIngredientKeys } from "./queryKeys";

export function useAddRecipeIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, ingredientId, quantity }: { recipeId: string; ingredientId: string; quantity: number }) => {
      const { error } = await supabase
        .from("recipe_ingredients")
        .insert([{ recipe_id: recipeId, ingredient_id: ingredientId, quantity }]);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeIngredientKeys.detail(variables.recipeId) });
    },
  });
}
