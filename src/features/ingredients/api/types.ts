export type IngredientWritePayload = {
  name: string;
  unit: string;
  supplier: string | null;
  // Modo inteligente: preenchidos -> unit_cost é derivado a partir deles.
  // Modo legado: ausentes -> unitCost é usado como veio do formulário.
  packageQuantity?: number | null;
  packagePrice?: number | null;
  wastePercentage?: number;
  unitCost: number;
};
