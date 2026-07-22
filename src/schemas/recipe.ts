import { z } from "zod";

// Validação de segurança para prevenir injection attacks
export const recipeSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-.,()]+$/, "Nome contém caracteres inválidos"),
  waste_percentage: z.number()
    .min(0, "Porcentagem deve ser positiva")
    .max(100, "Porcentagem não pode ser maior que 100"),
  prep_time_minutes: z.number()
    .min(0, "Tempo deve ser positivo")
    .max(10000, "Tempo muito longo"),
  notes: z.string()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional()
    .or(z.literal("")),
});

export type RecipeFormValues = z.infer<typeof recipeSchema>;

export type Recipe = {
  id: string;
  name: string;
  waste_percentage: number;
  prep_time_minutes: number;
  notes: string | null;
  category_id: string | null;
  default_servings: number;
};
