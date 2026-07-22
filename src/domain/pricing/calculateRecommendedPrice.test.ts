import { describe, expect, it } from "vitest";
import { calculateRecommendedPrice } from "./calculateRecommendedPrice";

describe("calculateRecommendedPrice", () => {
  // Cenário 7: cálculo com margem desejada — reproduz um caso numérico que já
  // existia em Pricing.tsx (custo=100, margem=30%, imposto=15%, fator=1.1),
  // provando que a extração não mudou o resultado.
  it("reproduz o cálculo de Pricing.tsx: custo 100, margem 30%, imposto 15%, fator 1.1", () => {
    const result = calculateRecommendedPrice({
      recipeCost: 100,
      profitMarginPercentage: 30,
      taxPercentage: 15,
      regionalFactor: 1.1,
    });
    expect(result.costWithProfit).toBe(130);
    expect(result.costWithTax).toBeCloseTo(149.5, 5);
    expect(result.recommendedPrice).toBeCloseTo(164.45, 5);
  });

  it("com fator regional 1 (ex: plano free, gate aplicado pelo chamador), preço não muda por região", () => {
    const result = calculateRecommendedPrice({
      recipeCost: 100,
      profitMarginPercentage: 30,
      taxPercentage: 15,
      regionalFactor: 1,
    });
    expect(result.recommendedPrice).toBeCloseTo(149.5, 5);
  });

  it("com margem e imposto 0, preço recomendado = custo × fator regional", () => {
    const result = calculateRecommendedPrice({
      recipeCost: 50,
      profitMarginPercentage: 0,
      taxPercentage: 0,
      regionalFactor: 1.25,
    });
    expect(result.recommendedPrice).toBeCloseTo(62.5, 5);
  });
});
