import { calculateIngredientUnitCost } from "@/domain/ingredients";
import type { IngredientWritePayload } from "./types";

// Compartilhado entre useCreateIngredient/useUpdateIngredient — mesma regra,
// um lugar só.
export function resolveUnitCost(payload: IngredientWritePayload): number {
  if (payload.packageQuantity && payload.packagePrice != null) {
    return calculateIngredientUnitCost({
      packageQuantity: payload.packageQuantity,
      packagePrice: payload.packagePrice,
      wastePercentage: payload.wastePercentage ?? 0,
    }).unitCost;
  }
  return payload.unitCost;
}
