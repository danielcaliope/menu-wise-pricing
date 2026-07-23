import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { recipeIngredientKeys } from "./queryKeys";

export function useRemoveRecipeIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; recipeId: string }) => {
      const { error } = await supabase.from("recipe_ingredients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeIngredientKeys.detail(variables.recipeId) });
    },
  });
}
