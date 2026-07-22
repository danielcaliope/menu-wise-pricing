export type MeasurementUnit = "g" | "kg" | "ml" | "l" | "un" | "dz";

export interface UnitCostPreview {
  baseUnit: MeasurementUnit;
  baseUnitCost: number;
}

// Fator até a menor unidade da mesma família (g, ml ou un) — usado só para a
// prévia informativa no formulário, nunca para reescrever `unit`/`unit_cost`.
const BASE_UNIT_BY_FAMILY: Record<MeasurementUnit, MeasurementUnit> = {
  g: "g",
  kg: "g",
  ml: "ml",
  l: "ml",
  un: "un",
  dz: "un",
};

const FACTOR_TO_BASE_UNIT: Record<MeasurementUnit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  un: 1,
  dz: 12,
};

export function previewBaseUnitCost(unit: MeasurementUnit, unitCost: number): UnitCostPreview {
  const factor = FACTOR_TO_BASE_UNIT[unit];
  return {
    baseUnit: BASE_UNIT_BY_FAMILY[unit],
    baseUnitCost: unitCost / factor,
  };
}
