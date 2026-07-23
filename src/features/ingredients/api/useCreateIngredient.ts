import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requireUser } from "@/features/shared/requireUser";
import { ingredientKeys } from "./queryKeys";
import { resolveUnitCost } from "./resolveUnitCost";
import type { IngredientWritePayload } from "./types";

export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: IngredientWritePayload): Promise<string> => {
      const user = await requireUser();

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ingredientKeys.all }),
  });
}
