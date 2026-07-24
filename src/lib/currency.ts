// unit_cost pode ser um valor sub-centavo (ex.: custo por grama) — toFixed(2)
// mostraria "R$ 0.00" indistintamente, escondendo o número que a tela existe
// para mostrar corretamente. Usado em toda tela que exibe unit_cost de ingrediente.
export function formatUnitCost(value: number): string {
  return value > 0 && value < 0.01 ? value.toFixed(4) : value.toFixed(2);
}
