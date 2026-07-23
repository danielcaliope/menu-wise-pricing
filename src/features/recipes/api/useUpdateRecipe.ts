import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { recipeKeys } from "./queryKeys";
import type { RecipeWritePayload } from "./types";

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: RecipeWritePayload }) => {
      const { error } = await supabase.from("recipes").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.all });
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.id) });
    },
  });
}
