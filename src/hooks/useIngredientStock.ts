import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIngredientMinStock(ingredientId: string | null) {
  return useQuery({
    queryKey: ["ingredient-stock", ingredientId],
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

export function useSetIngredientMinStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ingredientId, minStock }: { ingredientId: string; minStock: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Não inclui current_quantity no payload: numa atualização o Postgres não
      // mexe nele (preserva o que já foi registrado via movimentações em Stock.tsx);
      // numa criação usa o DEFAULT 0 da coluna.
      const { error } = await supabase
        .from("ingredient_stock")
        .upsert({
          user_id: user.id,
          ingredient_id: ingredientId,
          min_quantity: minStock,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: "user_id,ingredient_id",
        });

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ingredient-stock", variables.ingredientId] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}
