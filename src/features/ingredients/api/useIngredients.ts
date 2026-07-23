import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Ingredient } from "@/schemas/ingredient";
import { ingredientKeys } from "./queryKeys";

export function useIngredients() {
  const query = useQuery({
    queryKey: ingredientKeys.all,
    queryFn: async (): Promise<Ingredient[]> => {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name");

      if (error) throw error;
      return data ?? [];
    },
  });

  return {
    ingredients: query.data ?? [],
    isLoading: query.isLoading,
  };
}
