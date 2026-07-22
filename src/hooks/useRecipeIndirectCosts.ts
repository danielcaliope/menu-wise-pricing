import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export type RecipeIndirectCostInput = {
  recipe_id: string;
  cost_name: string;
  amount: number;
  cost_type: RecipeIndirectCostType;
  notes?: string | null;
};

// Sem recipeId: lista todos os custos por receita do usuário (usado por
// IndirectCosts.tsx). Com recipeId: filtra só os daquela receita (usado pelo
// editor unificado de receita).
export function useRecipeIndirectCosts(recipeId?: string) {
  const queryClient = useQueryClient();
  const queryKey = recipeId ? ["recipe-indirect-costs", recipeId] : ["recipe-indirect-costs"];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<RecipeIndirectCost[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

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

  const addCost = useMutation({
    mutationFn: async (input: RecipeIndirectCostInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipe-indirect-costs"] }),
  });

  const deleteCost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipe_indirect_costs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipe-indirect-costs"] }),
  });

  return {
    recipeIndirectCosts: query.data ?? [],
    isLoading: query.isLoading,
    addCost,
    deleteCost,
  };
}
