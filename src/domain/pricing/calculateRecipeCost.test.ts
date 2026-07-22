import { describe, expect, it } from "vitest";
import { calculateRecipeCost } from "./calculateRecipeCost";

describe("calculateRecipeCost", () => {
  it("sem perda e sem custo indireto, totalCost = ingredientsCost", () => {
    const result = calculateRecipeCost({
      ingredients: [{ quantity: 2, unitCost: 5 }],
      wastePercentage: 0,
      indirectCosts: [],
    });
    expect(result.ingredientsCost).toBe(10);
    expect(result.costWithWaste).toBe(10);
    expect(result.indirectCostsTotal).toBe(0);
    expect(result.totalCost).toBe(10);
  });

  // Cenário 4: receita com perda de ingrediente
  it("aplica a perda% sobre o custo dos ingredientes", () => {
    const semPerda = calculateRecipeCost({
      ingredients: [{ quantity: 1, unitCost: 100 }],
      wastePercentage: 0,
      indirectCosts: [],
    });
    const comPerda = calculateRecipeCost({
      ingredients: [{ quantity: 1, unitCost: 100 }],
      wastePercentage: 10,
      indirectCosts: [],
    });
    expect(semPerda.totalCost).toBe(100);
    expect(comPerda.costWithWaste).toBeCloseTo(110, 5); // 100 * 1.10
    expect(comPerda.totalCost).toBeCloseTo(110, 5);
    expect(comPerda.totalCost).toBeGreaterThan(semPerda.totalCost);
  });

  // Cenário 5: receita com embalagem (custo indireto)
  it("soma custos indiretos (embalagem, mão de obra) ao custo com perda", () => {
    const result = calculateRecipeCost({
      ingredients: [{ quantity: 1, unitCost: 100 }],
      wastePercentage: 10,
      indirectCosts: [2.5, 3], // embalagem + mão de obra
    });
    expect(result.costWithWaste).toBeCloseTo(110, 5);
    expect(result.indirectCostsTotal).toBeCloseTo(5.5, 5);
    expect(result.totalCost).toBeCloseTo(115.5, 5);
  });

  it("trata wastePercentage negativa como 0 (guarda nova)", () => {
    const result = calculateRecipeCost({
      ingredients: [{ quantity: 1, unitCost: 100 }],
      wastePercentage: -5,
      indirectCosts: [],
    });
    expect(result.costWithWaste).toBe(100);
  });
});
