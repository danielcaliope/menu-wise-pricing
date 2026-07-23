import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requireUser } from "@/features/shared/requireUser";
import { operatingCostKeys } from "./queryKeys";
import type { OperatingCostType } from "./useOperatingCosts";

export type OperatingCostInput = {
  name: string;
  cost_type: OperatingCostType;
  amount: number;
  description?: string | null;
};

export function useCreateOperatingCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OperatingCostInput) => {
      const user = await requireUser();

      const { error } = await supabase.from("indirect_costs").insert({
        user_id: user.id,
        name: input.name,
        cost_type: input.cost_type,
        amount: input.amount,
        description: input.description ?? null,
      });

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: operatingCostKeys.all }),
  });
}
