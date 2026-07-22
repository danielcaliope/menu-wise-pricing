import { describe, expect, it } from "vitest";
import { calculateIngredientCost } from "./calculateIngredientCost";

describe("calculateIngredientCost", () => {
  it("soma quantity × unitCost de todos os ingredientes", () => {
    const total = calculateIngredientCost([
      { quantity: 2, unitCost: 5 },
      { quantity: 1, unitCost: 10 },
    ]);
    expect(total).toBe(20);
  });

  it("retorna 0 para lista vazia", () => {
    expect(calculateIngredientCost([])).toBe(0);
  });
});
