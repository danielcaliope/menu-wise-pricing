import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ingredientKeys } from "./queryKeys";
import { resolveUnitCost } from "./resolveUnitCost";
import type { IngredientWritePayload } from "./types";

export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.all });
      queryClient.invalidateQueries({ queryKey: ingredientKeys.detail(variables.id) });
    },
  });
}
