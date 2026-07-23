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

type PricingConfigQueryResult = {
  config: PricingConfig;
  hasSavedConfig: boolean;
};

export function usePricingConfig() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pricing-config"],
    queryFn: async (): Promise<PricingConfigQueryResult> => {
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
          hasSavedConfig: true,
          config: {
            profit_margin_percentage: Number(data.profit_margin_percentage),
            tax_percentage: Number(data.tax_percentage),
            regional_factor: Number(data.regional_factor),
            income_level: data.income_level || "medium",
            delivery_fee_percentage: Number(data.delivery_fee_percentage || 0),
          },
        };
      }

      // Sem linha ainda: devolve os defaults só em memória, sem gravar nada —
      // "existe uma linha salva" precisa continuar significando "o usuário
      // configurou de propósito" (usado pelo checklist de onboarding).
      return { hasSavedConfig: false, config: DEFAULT_PRICING_CONFIG };
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
    config: query.data?.config ?? DEFAULT_PRICING_CONFIG,
    hasSavedConfig: query.data?.hasSavedConfig ?? false,
    isLoading: query.isLoading,
    saveConfig,
  };
}
