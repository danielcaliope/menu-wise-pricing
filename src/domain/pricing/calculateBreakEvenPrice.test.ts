import { describe, expect, it } from "vitest";
import { calculateBreakEvenPrice } from "./calculateBreakEvenPrice";
import { calculateFixedCostAllocation } from "./calculateFixedCostAllocation";

describe("calculateBreakEvenPrice", () => {
  // Cenário 6: cálculo de preço mínimo
  it("soma custo variável por unidade + custo fixo alocado por unidade", () => {
    const price = calculateBreakEvenPrice({ variableCostPerUnit: 12, fixedCostPerUnit: 3 });
    expect(price).toBe(15);
  });

  it("encadeado com calculateFixedCostAllocation pra gerar o fixedCostPerUnit", () => {
    const fixedCostPerUnit = calculateFixedCostAllocation({ totalFixedCosts: 3000, estimatedVolume: 1000 });
    const price = calculateBreakEvenPrice({ variableCostPerUnit: 12, fixedCostPerUnit });
    expect(fixedCostPerUnit).toBe(3);
    expect(price).toBe(15);
  });

  it("com custo fixo alocado 0, o preço mínimo é só o custo variável", () => {
    const price = calculateBreakEvenPrice({ variableCostPerUnit: 12, fixedCostPerUnit: 0 });
    expect(price).toBe(12);
  });
});
