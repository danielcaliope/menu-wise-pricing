import { describe, expect, it } from "vitest";
import { calculateContributionMargin } from "./calculateContributionMargin";

describe("calculateContributionMargin", () => {
  it("calcula a margem de contribuição e o percentual", () => {
    const result = calculateContributionMargin({ netRevenuePerUnit: 80, variableCostPerUnit: 30 });
    expect(result.contributionMargin).toBe(50);
    expect(result.contributionMarginPercentage).toBeCloseTo(62.5, 5);
  });

  it("retorna margem negativa quando o custo variável supera a receita líquida", () => {
    const result = calculateContributionMargin({ netRevenuePerUnit: 20, variableCostPerUnit: 30 });
    expect(result.contributionMargin).toBe(-10);
  });

  it("retorna percentual 0 quando netRevenuePerUnit é 0 (guarda de divisão por zero)", () => {
    const result = calculateContributionMargin({ netRevenuePerUnit: 0, variableCostPerUnit: 10 });
    expect(result.contributionMarginPercentage).toBe(0);
    expect(result.contributionMargin).toBe(-10);
  });
});
