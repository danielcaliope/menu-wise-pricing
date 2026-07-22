import { describe, expect, it } from "vitest";
import { calculateFixedCostAllocation } from "./calculateFixedCostAllocation";

describe("calculateFixedCostAllocation", () => {
  it("divide o custo fixo total pelo volume estimado", () => {
    expect(calculateFixedCostAllocation({ totalFixedCosts: 3000, estimatedVolume: 1000 })).toBe(3);
  });

  it("retorna 0 quando o volume estimado é 0 (guarda de divisão por zero)", () => {
    expect(calculateFixedCostAllocation({ totalFixedCosts: 3000, estimatedVolume: 0 })).toBe(0);
  });

  it("retorna 0 quando o volume estimado é negativo", () => {
    expect(calculateFixedCostAllocation({ totalFixedCosts: 3000, estimatedVolume: -10 })).toBe(0);
  });
});
