import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requireUser } from "@/features/shared/requireUser";
import { operatingCostKeys } from "./queryKeys";

export type OperatingCostType = "fixed_monthly" | "variable";

export type OperatingCost = {
  id: string;
  name: string;
  cost_type: OperatingCostType;
  amount: number;
  description: string | null;
  created_at: string;
};

// Custos indiretos GLOBAIS do negócio (aluguel, água, luz) — diferente de
// recipe_indirect_costs (embalagem/mão de obra POR receita), que mora em
// src/features/recipes/api.
export function useOperatingCosts() {
  const query = useQuery({
    queryKey: operatingCostKeys.all,
    queryFn: async (): Promise<OperatingCost[]> => {
      const user = await requireUser();

      const { data, error } = await supabase
        .from("indirect_costs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as OperatingCost[]) ?? [];
    },
  });

  return {
    operatingCosts: query.data ?? [],
    isLoading: query.isLoading,
  };
}
