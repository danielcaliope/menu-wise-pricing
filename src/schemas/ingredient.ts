import { z } from "zod";

// Validação de segurança para prevenir injection attacks
export const ingredientSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-.,()]+$/, "Nome contém caracteres inválidos"),
  unit: z.string()
    .trim()
    .min(1, "Unidade é obrigatória")
    .max(20, "Unidade deve ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z\s]+$/, "Unidade contém caracteres inválidos"),
  unit_cost: z.number()
    .min(0, "Custo deve ser positivo")
    .max(999999.99, "Custo muito alto"),
  supplier: z.string()
    .trim()
    .max(100, "Fornecedor deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-.,()]*$/, "Fornecedor contém caracteres inválidos")
    .optional()
    .nullable(),
  package_quantity: z.number()
    .positive("Quantidade da embalagem deve ser maior que zero")
    .optional()
    .nullable(),
  package_price: z.number()
    .min(0, "Preço pago deve ser positivo")
    .optional()
    .nullable(),
  waste_percentage: z.number()
    .min(0, "Perda não pode ser negativa")
    .max(99.99, "Perda deve ser menor que 100%")
    .default(0),
  min_stock: z.number()
    .min(0, "Estoque mínimo não pode ser negativo")
    .optional()
    .nullable(),
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
  supplier: string | null;
  package_quantity: number | null;
  package_price: number | null;
  waste_percentage: number;
};
