import type { IngredientLine } from "./types";

/**
 * Custo de uma única linha de ingrediente (quantity × unitCost).
 *
 * Extraída da conta que já estava solta em RecipeIngredientsDialog.tsx:227 —
 * mesma fórmula, centralizada aqui pra nenhuma tela precisar reimplementá-la.
 */
export function calculateIngredientLineCost(ingredient: IngredientLine): number {
  return ingredient.quantity * ingredient.unitCost;
}
