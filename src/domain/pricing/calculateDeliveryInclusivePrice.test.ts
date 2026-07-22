import { describe, expect, it } from "vitest";
import { calculateDeliveryInclusivePrice } from "./calculateDeliveryInclusivePrice";

describe("calculateDeliveryInclusivePrice", () => {
  it("sem taxa: preço com delivery é igual ao preço base", () => {
    const result = calculateDeliveryInclusivePrice({ price: 100, deliveryFeePercentage: 0 });
    expect(result.feeAmount).toBe(0);
    expect(result.priceWithDelivery).toBe(100);
  });

  it("reproduz exatamente a conta que estava inline em Pricing.tsx", () => {
    const price = 23.28;
    const deliveryFeePercentage = 23;
    const expected = price * (1 + deliveryFeePercentage / 100);
    const result = calculateDeliveryInclusivePrice({ price, deliveryFeePercentage });
    expect(result.priceWithDelivery).toBeCloseTo(expected, 6);
    expect(result.feeAmount).toBeCloseTo(price * (deliveryFeePercentage / 100), 6);
  });
});
