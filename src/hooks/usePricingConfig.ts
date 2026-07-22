import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PricingConfig = {
  profit_margin_percentage: number;
  tax_percentage: number;
  regional_factor: number;
  income_level: string;
  delivery_fee_percentage: number;
};

// Mesmos valores dos defaults das colunas em `pricing_configs` no banco —
// única fonte, pra Pricing.tsx e qualquer outra tela nunca divergirem sobre
// qual é a configuração "padrão" de um usuário que ainda não salvou nada.
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  profit_margin_percentage: 30,
  tax_percentage: 15,
  regional_factor: 1.0,
  income_level: "medium",
  delivery_fee_percentage: 0,
};

export function usePricingConfig() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pricing-config"],
    queryFn: async (): Promise<PricingConfig> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("pricing_configs")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return {
          profit_margin_percentage: Number(data.profit_margin_percentage),
          tax_percentage: Number(data.tax_percentage),
          regional_factor: Number(data.regional_factor),
          income_level: data.income_level || "medium",
          delivery_fee_percentage: Number(data.delivery_fee_percentage || 0),
        };
      }

      // Get-or-create: ainda não existe linha pra este usuário — cria com os
      // defaults das colunas (mesmos valores de DEFAULT_PRICING_CONFIG).
      await supabase.from("pricing_configs").insert([{ user_id: user.id }]);
      return DEFAULT_PRICING_CONFIG;
    },
  });

  const saveConfig = useMutation({
    mutationFn: async (config: PricingConfig) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("pricing_configs").upsert(
        { user_id: user.id, ...config },
        { onConflict: "user_id" },
      );

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pricing-config"] }),
  });

  return {
    config: query.data ?? DEFAULT_PRICING_CONFIG,
    isLoading: query.isLoading,
    saveConfig,
  };
}
