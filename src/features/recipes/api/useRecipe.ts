import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Recipe } from "@/schemas/recipe";
import { recipeKeys } from "./queryKeys";

// Item único por id — não existia antes da Etapa 8.
export function useRecipe(id: string | null) {
  const query = useQuery({
    queryKey: recipeKeys.detail(id ?? ""),
    queryFn: async (): Promise<Recipe | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return {
    recipe: query.data ?? null,
    isLoading: query.isLoading,
  };
}
