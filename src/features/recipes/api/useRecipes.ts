import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Recipe } from "@/schemas/recipe";
import { recipeKeys } from "./queryKeys";

export function useRecipes() {
  const query = useQuery({
    queryKey: recipeKeys.all,
    queryFn: async (): Promise<Recipe[]> => {
      const { data, error } = await supabase.from("recipes").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return {
    recipes: query.data ?? [],
    isLoading: query.isLoading,
  };
}
