import type { DeliveryInclusivePriceInput, DeliveryInclusivePriceResult } from "./types";

/**
 * Extraída da conta que já estava inline em Pricing.tsx (4 ocorrências) —
 * mesma fórmula, centralizada aqui. Modelo aditivo (o cliente paga a mais
 * pela entrega) — diferente de calculateChannelPrice, que desconta uma
 * comissão da receita do canal. Não confundir os dois.
 */
export function calculateDeliveryInclusivePrice(
  input: DeliveryInclusivePriceInput,
): DeliveryInclusivePriceResult {
  const feeAmount = input.price * (input.deliveryFeePercentage / 100);
  return {
    price: input.price,
    deliveryFeePercentage: input.deliveryFeePercentage,
    feeAmount,
    priceWithDelivery: input.price + feeAmount,
  };
}
