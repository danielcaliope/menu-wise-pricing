import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requireUser } from "@/features/shared/requireUser";
import { recipeIndirectCostKeys } from "./queryKeys";
import type { RecipeIndirectCostType } from "./useRecipeIndirectCosts";

export type RecipeIndirectCostInput = {
  recipe_id: string;
  cost_name: string;
  amount: number;
  cost_type: RecipeIndirectCostType;
  notes?: string | null;
};

export function useAddRecipeIndirectCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecipeIndirectCostInput) => {
      const user = await requireUser();

      const { error } = await supabase.from("recipe_indirect_costs").insert({
        user_id: user.id,
        recipe_id: input.recipe_id,
        cost_name: input.cost_name,
        amount: input.amount,
        cost_type: input.cost_type,
        notes: input.notes ?? null,
      });

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recipeIndirectCostKeys.all }),
  });
}
