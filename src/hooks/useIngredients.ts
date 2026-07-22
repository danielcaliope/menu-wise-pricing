import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateIngredientUnitCost } from "@/domain/ingredients";
import type { Ingredient } from "@/schemas/ingredient";

export type IngredientWritePayload = {
  name: string;
  unit: string;
  supplier: string | null;
  // Modo inteligente: preenchidos -> unit_cost é derivado aqui.
  // Modo legado: ausentes -> unitCost é usado como veio do formulário.
  packageQuantity?: number | null;
  packagePrice?: number | null;
  wastePercentage?: number;
  unitCost: number;
};

function resolveUnitCost(payload: IngredientWritePayload): number {
  if (payload.packageQuantity && payload.packagePrice != null) {
    return calculateIngredientUnitCost({
      packageQuantity: payload.packageQuantity,
      packagePrice: payload.packagePrice,
      wastePercentage: payload.wastePercentage ?? 0,
    }).unitCost;
  }
  return payload.unitCost;
}

export function useIngredients() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["ingredients"],
    queryFn: async (): Promise<Ingredient[]> => {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name");

      if (error) throw error;
      return data ?? [];
    },
  });

  const createIngredient = useMutation({
    mutationFn: async (payload: IngredientWritePayload): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("ingredients")
        .insert([{
          name: payload.name,
          unit: payload.unit,
          unit_cost: resolveUnitCost(payload),
          supplier: payload.supplier,
          package_quantity: payload.packageQuantity ?? null,
          package_price: payload.packagePrice ?? null,
          waste_percentage: payload.wastePercentage ?? 0,
          user_id: user.id,
        }])
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingredients"] }),
  });

  const updateIngredient = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: IngredientWritePayload }) => {
      const { error } = await supabase
        .from("ingredients")
        .update({
          name: payload.name,
          unit: payload.unit,
          unit_cost: resolveUnitCost(payload),
          supplier: payload.supplier,
          package_quantity: payload.packageQuantity ?? null,
          package_price: payload.packagePrice ?? null,
          waste_percentage: payload.wastePercentage ?? 0,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingredients"] }),
  });

  const deleteIngredient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ingredients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingredients"] }),
  });

  const importIngredients = useMutation({
    mutationFn: async (rows: Array<{ name: string; unit: string; unit_cost: number; supplier: string | null }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("ingredients")
        .insert(rows.map((row) => ({ ...row, user_id: user.id })));

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingredients"] }),
  });

  return {
    ingredients: query.data ?? [],
    isLoading: query.isLoading,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    importIngredients,
  };
}
