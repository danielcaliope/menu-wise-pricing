import type { ChannelPriceInput, ChannelPriceResult } from "./types";

/**
 * Calcula quanto o negócio efetivamente recebe (netRevenue) de uma venda feita
 * por um canal, descontando a taxa desse canal (percentual e/ou fixa).
 *
 * GENERALIZAÇÃO EXPLÍCITA: hoje o app só tem um caso desse conceito —
 * delivery_fee_percentage em Pricing.tsx (só percentual, usado como
 * preço × (1 + taxa/100), ver linhas 287/604/650). Não existe hoje taxa fixa de
 * canal em nenhum lugar do schema/UI. Esta função generaliza esse único caso
 * pra suportar: nenhuma taxa, só percentual, só fixa, ou as duas combinadas —
 * é extensão documentada, não fórmula "descoberta" no código existente.
 *
 * fee ausente ou vazio ({}) → sem taxa, netRevenue = price (cenário 1).
 */
export function calculateChannelPrice(input: ChannelPriceInput): ChannelPriceResult {
  const percentage = input.fee?.percentage ?? 0;
  const fixed = input.fee?.fixed ?? 0;

  const feeAmount = input.price * (percentage / 100) + fixed;
  const netRevenue = input.price - feeAmount;

  return {
    grossPrice: input.price,
    feeAmount,
    netRevenue,
  };
}
