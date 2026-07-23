export const ingredientKeys = {
  all: ["ingredients"] as const,
  detail: (id: string) => ["ingredients", id] as const,
};

export const ingredientMinStockKeys = {
  detail: (ingredientId: string | null) => ["ingredient-stock", ingredientId] as const,
};
