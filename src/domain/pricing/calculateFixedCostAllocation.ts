import type { FixedCostAllocationInput } from "./types";

/**
 * Rateio de custo fixo por unidade — totalFixedCosts / estimatedVolume.
 *
 * NOVA: não existe hoje em nenhum lugar do app (IndirectCosts.tsx só soma o total
 * mensal de custos fixos via getTotalFixedCosts, sem dividir por volume produzido/
 * vendido). Não há campo de "volume estimado" hoje em nenhuma tela — por isso esta
 * função ainda não tem integração mínima nesta etapa, fica pronta pra uso futuro.
 *
 * estimatedVolume <= 0 retorna 0 em vez de Infinity/NaN (guarda de divisão por zero).
 */
export function calculateFixedCostAllocation(input: FixedCostAllocationInput): number {
  if (input.estimatedVolume <= 0) return 0;
  return input.totalFixedCosts / input.estimatedVolume;
}
