import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Ingredient } from "@/schemas/ingredient";
import { ingredientKeys } from "./queryKeys";

// Item único por id — não existia antes da Etapa 8 (as telas sempre
// passavam o objeto já carregado via useIngredients() como prop).
export function useIngredient(id: string | null) {
  const query = useQuery({
    queryKey: ingredientKeys.detail(id ?? ""),
    queryFn: async (): Promise<Ingredient | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return {
    ingredient: query.data ?? null,
    isLoading: query.isLoading,
  };
}
