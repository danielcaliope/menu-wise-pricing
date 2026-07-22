import { describe, expect, it } from "vitest";
import { calculateIngredientLineCost } from "./calculateIngredientLineCost";
import { calculateIngredientCost } from "./calculateIngredientCost";

describe("calculateIngredientLineCost", () => {
  it("multiplica quantidade pelo custo unitário", () => {
    expect(calculateIngredientLineCost({ quantity: 2, unitCost: 5 })).toBe(10);
  });

  it("quantidade zero resulta em custo zero", () => {
    expect(calculateIngredientLineCost({ quantity: 0, unitCost: 5 })).toBe(0);
  });

  it("calculateIngredientCost continua somando as linhas exatamente igual", () => {
    const lines = [{ quantity: 2, unitCost: 5 }, { quantity: 1, unitCost: 3 }];
    const sumOfLines = lines.reduce((sum, l) => sum + calculateIngredientLineCost(l), 0);
    expect(calculateIngredientCost(lines)).toBe(sumOfLines);
  });
});
