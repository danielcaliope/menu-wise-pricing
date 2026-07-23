import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requireUser } from "@/features/shared/requireUser";
import { ingredientKeys } from "./queryKeys";

type ImportRow = { name: string; unit: string; unit_cost: number; supplier: string | null };

export function useImportIngredients() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rows: ImportRow[]) => {
      const user = await requireUser();

      const { error } = await supabase
        .from("ingredients")
        .insert(rows.map((row) => ({ ...row, user_id: user.id })));

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ingredientKeys.all }),
  });
}
