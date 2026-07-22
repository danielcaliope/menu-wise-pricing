import type { IngredientLine } from "./types";
import { calculateIngredientLineCost } from "./calculateIngredientLineCost";

/**
 * Soma quantity × unitCost de uma lista de ingredientes.
 *
 * Reaproveitada de RecipeIngredientsDialog.tsx:78-83 e PortionCalculator.tsx:75-77 —
 * mesma conta que os dois já faziam (sem perda%, sem custo indireto). Ver
 * calculateRecipeCost() pra a fórmula completa usada em Pricing.tsx.
 */
export function calculateIngredientCost(ingredients: IngredientLine[]): number {
  return ingredients.reduce((sum, item) => sum + calculateIngredientLineCost(item), 0);
}
