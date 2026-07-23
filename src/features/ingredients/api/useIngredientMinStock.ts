import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ingredientMinStockKeys } from "./queryKeys";

export function useIngredientMinStock(ingredientId: string | null) {
  return useQuery({
    queryKey: ingredientMinStockKeys.detail(ingredientId),
    queryFn: async (): Promise<number | null> => {
      if (!ingredientId) return null;
      const { data, error } = await supabase
        .from("ingredient_stock")
        .select("min_quantity")
        .eq("ingredient_id", ingredientId)
        .maybeSingle();

      if (error) throw error;
      return data?.min_quantity ?? null;
    },
    enabled: !!ingredientId,
  });
}
