export interface IngredientUnitCostInput {
  packageQuantity: number;
  packagePrice: number;
  wastePercentage: number;
}

export interface IngredientUnitCostResult {
  usableQuantity: number;
  unitCost: number;
}

export function calculateIngredientUnitCost(input: IngredientUnitCostInput): IngredientUnitCostResult {
  const safeWaste = Math.max(0, input.wastePercentage);
  const usableQuantity = input.packageQuantity * (1 - safeWaste / 100);

  if (usableQuantity <= 0) {
    return { usableQuantity: 0, unitCost: 0 };
  }

  return {
    usableQuantity,
    unitCost: input.packagePrice / usableQuantity,
  };
}
