import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { requireUser } from "@/features/shared/requireUser";
import { ingredientMinStockKeys } from "./queryKeys";

export function useSetIngredientMinStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ingredientId, minStock }: { ingredientId: string; minStock: number }) => {
      const user = await requireUser();

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
      queryClient.invalidateQueries({ queryKey: ingredientMinStockKeys.detail(variables.ingredientId) });
      // "stock" é da feature de inventário (ainda não migrada nesta etapa) —
      // mantido como string literal até essa feature ganhar sua própria
      // query key factory.
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}
