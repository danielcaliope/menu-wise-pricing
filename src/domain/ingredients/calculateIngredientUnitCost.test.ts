import { describe, expect, it } from "vitest";
import { calculateIngredientUnitCost } from "./calculateIngredientUnitCost";

describe("calculateIngredientUnitCost", () => {
  it("sem perda: custo = preço / quantidade", () => {
    const result = calculateIngredientUnitCost({
      packageQuantity: 1000, // 1kg em gramas
      packagePrice: 5.5,
      wastePercentage: 0,
    });
    expect(result.usableQuantity).toBe(1000);
    expect(result.unitCost).toBeCloseTo(0.0055, 6);
  });

  it("com perda: quantidade utilizável reduz e custo por unidade sobe", () => {
    const semPerda = calculateIngredientUnitCost({
      packageQuantity: 1000,
      packagePrice: 5.5,
      wastePercentage: 0,
    });
    const comPerda = calculateIngredientUnitCost({
      packageQuantity: 1000,
      packagePrice: 5.5,
      wastePercentage: 5,
    });
    expect(comPerda.usableQuantity).toBeCloseTo(950, 6);
    expect(comPerda.unitCost).toBeGreaterThan(semPerda.unitCost);
    expect(comPerda.unitCost).toBeCloseTo(5.5 / 950, 6);
  });

  it("embalagem grande com preço fracionário calcula custo sub-centavo por grama", () => {
    const result = calculateIngredientUnitCost({
      packageQuantity: 5000, // 5kg em gramas
      packagePrice: 27.5,
      wastePercentage: 10,
    });
    expect(result.usableQuantity).toBeCloseTo(4500, 6);
    expect(result.unitCost).toBeCloseTo(27.5 / 4500, 8);
    expect(result.unitCost).toBeLessThan(0.01);
  });

  it("trata wastePercentage negativa como 0 (guarda)", () => {
    const result = calculateIngredientUnitCost({
      packageQuantity: 100,
      packagePrice: 10,
      wastePercentage: -20,
    });
    expect(result.usableQuantity).toBe(100);
  });

  it("perda de 100% ou mais: quantidade utilizável zerada, sem divisão por zero/negativo", () => {
    const result = calculateIngredientUnitCost({
      packageQuantity: 100,
      packagePrice: 10,
      wastePercentage: 100,
    });
    expect(result.usableQuantity).toBe(0);
    expect(result.unitCost).toBe(0);
  });

  it("packageQuantity zero: guarda contra divisão por zero", () => {
    const result = calculateIngredientUnitCost({
      packageQuantity: 0,
      packagePrice: 10,
      wastePercentage: 0,
    });
    expect(result.usableQuantity).toBe(0);
    expect(result.unitCost).toBe(0);
  });
});
