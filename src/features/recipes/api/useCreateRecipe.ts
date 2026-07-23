import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requireUser } from "@/features/shared/requireUser";
import { recipeKeys } from "./queryKeys";
import type { RecipeWritePayload } from "./types";

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RecipeWritePayload): Promise<string> => {
      const user = await requireUser();

      const { data, error } = await supabase
        .from("recipes")
        .insert([{ ...payload, user_id: user.id }])
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recipeKeys.all }),
  });
}
