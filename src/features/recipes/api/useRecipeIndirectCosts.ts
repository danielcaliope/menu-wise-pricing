import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requireUser } from "@/features/shared/requireUser";
import { recipeIndirectCostKeys } from "./queryKeys";

export type RecipeIndirectCostType = "packaging" | "labor" | "other";

export type RecipeIndirectCost = {
  id: string;
  recipe_id: string;
  cost_name: string;
  amount: number;
  cost_type: RecipeIndirectCostType;
  notes: string | null;
  recipes?: { name: string };
};

// Sem recipeId: lista todos os custos por receita do usuário (usado por
// IndirectCosts.tsx). Com recipeId: filtra só os daquela receita (usado pelo
// editor unificado de receita).
export function useRecipeIndirectCosts(recipeId?: string) {
  const queryKey = recipeId ? recipeIndirectCostKeys.detail(recipeId) : recipeIndirectCostKeys.all;

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<RecipeIndirectCost[]> => {
      const user = await requireUser();

      let builder = supabase
        .from("recipe_indirect_costs")
        .select("*, recipes(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (recipeId) builder = builder.eq("recipe_id", recipeId);

      const { data, error } = await builder;
      if (error) throw error;
      return (data as RecipeIndirectCost[]) ?? [];
    },
  });

  return {
    recipeIndirectCosts: query.data ?? [],
    isLoading: query.isLoading,
  };
}
