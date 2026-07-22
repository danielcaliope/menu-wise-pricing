import { describe, expect, it } from "vitest";
import { previewBaseUnitCost } from "./convertUnit";

describe("previewBaseUnitCost", () => {
  it("kg -> g: divide por 1000", () => {
    const result = previewBaseUnitCost("kg", 5.5);
    expect(result.baseUnit).toBe("g");
    expect(result.baseUnitCost).toBeCloseTo(0.0055, 6);
  });

  it("l -> ml: divide por 1000", () => {
    const result = previewBaseUnitCost("l", 8);
    expect(result.baseUnit).toBe("ml");
    expect(result.baseUnitCost).toBeCloseTo(0.008, 6);
  });

  it("dz -> un: divide por 12", () => {
    const result = previewBaseUnitCost("dz", 12);
    expect(result.baseUnit).toBe("un");
    expect(result.baseUnitCost).toBeCloseTo(1, 6);
  });

  it("g/ml/un: identidade, sem conversão", () => {
    expect(previewBaseUnitCost("g", 0.5)).toEqual({ baseUnit: "g", baseUnitCost: 0.5 });
    expect(previewBaseUnitCost("ml", 0.3)).toEqual({ baseUnit: "ml", baseUnitCost: 0.3 });
    expect(previewBaseUnitCost("un", 2)).toEqual({ baseUnit: "un", baseUnitCost: 2 });
  });
});
