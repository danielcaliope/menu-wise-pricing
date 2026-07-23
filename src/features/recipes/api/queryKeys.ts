export const recipeKeys = {
  all: ["recipes"] as const,
  detail: (id: string) => ["recipes", id] as const,
};

export const recipeIngredientKeys = {
  detail: (recipeId: string | null) => ["recipe-ingredients", recipeId] as const,
};

// Sem recipeId: todos os custos por receita do usuário (usado por
// IndirectCosts.tsx). Com recipeId: só os daquela receita.
export const recipeIndirectCostKeys = {
  all: ["recipe-indirect-costs"] as const,
  detail: (recipeId: string) => ["recipe-indirect-costs", recipeId] as const,
};
