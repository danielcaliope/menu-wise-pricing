import { calculateIngredientCost } from "./calculateIngredientCost";
import type { RecipeCostBreakdown, RecipeCostInput } from "./types";

/**
 * Fórmula completa de custo de receita.
 *
 * Reaproveitada de Pricing.tsx:189-204 (calculateRecipeCost): custo dos ingredientes
 * com perda% aplicada, mais a soma dos custos indiretos da receita (embalagem,
 * mão de obra etc — recipe_indirect_costs). Diferente de calculateIngredientCost(),
 * que só soma ingredientes — ver a nota de divergência no plano sobre por que essas
 * duas camadas existem separadamente (RecipeIngredientsDialog/PortionCalculator hoje
 * mostram só o ingredientsCost, não o totalCost completo).
 *
 * wastePercentage negativa é tratada como 0 (guarda nova — o app hoje não valida isso).
 */
export function calculateRecipeCost(input: RecipeCostInput): RecipeCostBreakdown {
  const ingredientsCost = calculateIngredientCost(input.ingredients);
  const safeWaste = Math.max(0, input.wastePercentage);
  const costWithWaste = ingredientsCost * (1 + safeWaste / 100);
  const indirectCostsTotal = input.indirectCosts.reduce((sum, amount) => sum + amount, 0);
  const totalCost = costWithWaste + indirectCostsTotal;

  return {
    ingredientsCost,
    costWithWaste,
    indirectCostsTotal,
    totalCost,
  };
}
