import type { ContributionMarginInput, ContributionMarginResult } from "./types";

/**
 * Margem de contribuição = receita líquida por unidade − custo variável por unidade.
 *
 * NOVA: fórmula contábil padrão, não existe em nenhum lugar do app hoje. netRevenuePerUnit
 * é tipicamente o resultado de calculateChannelPrice(...).netRevenue pra uma unidade.
 *
 * netRevenuePerUnit === 0 retorna contributionMarginPercentage 0 (guarda de divisão
 * por zero, em vez de Infinity/NaN — ver divergência #4 do plano).
 */
export function calculateContributionMargin(input: ContributionMarginInput): ContributionMarginResult {
  const contributionMargin = input.netRevenuePerUnit - input.variableCostPerUnit;
  const contributionMarginPercentage =
    input.netRevenuePerUnit === 0 ? 0 : (contributionMargin / input.netRevenuePerUnit) * 100;

  return {
    contributionMargin,
    contributionMarginPercentage,
  };
}
