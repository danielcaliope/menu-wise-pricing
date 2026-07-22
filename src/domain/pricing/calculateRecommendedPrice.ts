import type { RecommendedPriceInput, RecommendedPriceResult } from "./types";

/**
 * Preço recomendado: (custo + lucro% + impostos%) × fator regional.
 *
 * Reaproveitada de Pricing.tsx:213-222 (calculateSuggestedPrice) — mesma fórmula,
 * mesma ordem de aplicação (lucro antes de imposto, fator regional por último).
 *
 * `regionalFactor` é recebido já resolvido pelo chamador — o gate de plano
 * free/paid (Pricing.tsx:214: só usuário pago aplica o fator regional) e o
 * conflito entre a tabela de renda e o CepLookup (ver divergências #2/#3 do
 * plano) são decisões de UI/estado, não fazem parte deste cálculo puro.
 */
export function calculateRecommendedPrice(input: RecommendedPriceInput): RecommendedPriceResult {
  const costWithProfit = input.recipeCost * (1 + input.profitMarginPercentage / 100);
  const costWithTax = costWithProfit * (1 + input.taxPercentage / 100);
  const recommendedPrice = costWithTax * input.regionalFactor;

  return {
    costWithProfit,
    costWithTax,
    recommendedPrice,
  };
}
