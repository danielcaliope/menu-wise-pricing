import type { BreakEvenPriceInput } from "./types";

/**
 * Preço mínimo (break-even): variableCostPerUnit + fixedCostPerUnit.
 * Abaixo desse preço, a venda dá prejuízo (margem de contribuição não cobre o
 * custo fixo alocado); exatamente nesse preço, lucro = 0.
 *
 * NOVA: fórmula contábil padrão, não existe em nenhum lugar do app hoje.
 * fixedCostPerUnit normalmente vem de calculateFixedCostAllocation(...).
 */
export function calculateBreakEvenPrice(input: BreakEvenPriceInput): number {
  return input.variableCostPerUnit + input.fixedCostPerUnit;
}
