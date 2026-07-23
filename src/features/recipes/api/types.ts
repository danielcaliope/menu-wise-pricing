export type RecipeWritePayload = {
  name: string;
  waste_percentage: number;
  prep_time_minutes: number;
  notes: string;
  category_id: string | null;
  default_servings: number;
};
