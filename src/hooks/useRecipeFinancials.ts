import { useMemo } from "react";
import {
  calculateRecipeCost,
  calculateBreakEvenPrice,
  calculateRecommendedPrice,
  calculateContributionMargin,
  calculateDeliveryInclusivePrice,
} from "@/domain/pricing";
import { useRecipeIngredients, useRecipeIndirectCosts } from "@/features/recipes/api";
import { usePricingConfig } from "./usePricingConfig";
import { useProfile } from "./useProfile";

export type IngredientLineDisplay = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitCost: number;
  lineCost: number;
};

export type RecipeFinancialSummaryData = {
  isLoading: boolean;
  hasIngredients: boolean;
  hasChannelFee: boolean;
  ingredientLines: IngredientLineDisplay[];
  directCost: number;
  wasteCost: number;
  packagingCost: number;
  otherIndirectCost: number;
  minimumPrice: number;
  recommendedPrice: number;
  estimatedMargin: number;
  estimatedMarginPercentage: number;
  priceWithDelivery: number | null;
  deliveryFeePercentage: number;
};

// Recebe wastePercentage "ao vivo" (do formulário, antes de salvar) em vez de
// só o valor já persistido em `recipes.waste_percentage` — assim o resumo
// reage a cada tecla digitada sem precisar de um sistema de rascunho separado.
export function useRecipeFinancials(recipeId: string | null, liveWastePercentage: number) {
  const { recipeIngredients, isLoading: loadingIngredients } = useRecipeIngredients(recipeId);
  const { recipeIndirectCosts, isLoading: loadingIndirectCosts } = useRecipeIndirectCosts(recipeId);
  const { config: pricingConfig, isLoading: loadingConfig } = usePricingConfig();
  const { profile, isLoading: loadingProfile } = useProfile();

  const data = useMemo<RecipeFinancialSummaryData>(() => {
    const ingredientLines: IngredientLineDisplay[] = recipeIngredients.map((ri) => ({
      id: ri.id,
      name: ri.ingredients.name,
      unit: ri.ingredients.unit,
      quantity: ri.quantity,
      unitCost: ri.ingredients.unit_cost,
      lineCost: ri.quantity * ri.ingredients.unit_cost,
    }));

    const packagingCosts = recipeIndirectCosts
      .filter((c) => c.cost_type === "packaging")
      .map((c) => Number(c.amount));
    const otherCosts = recipeIndirectCosts
      .filter((c) => c.cost_type !== "packaging")
      .map((c) => Number(c.amount));

    const breakdown = calculateRecipeCost({
      ingredients: ingredientLines.map((line) => ({ quantity: line.quantity, unitCost: line.unitCost })),
      wastePercentage: liveWastePercentage,
      indirectCosts: [...packagingCosts, ...otherCosts],
    });

    // Preço mínimo nesta etapa reflete só custo direto (ingredientes + perda +
    // custos indiretos desta receita) — fixedCostPerUnit fica 0 porque não
    // existe hoje um dado de "volume estimado" pra ratear custos fixos globais
    // sem inventá-lo (decisão registrada no plano da Etapa 4).
    const minimumPrice = calculateBreakEvenPrice({
      variableCostPerUnit: breakdown.totalCost,
      fixedCostPerUnit: 0,
    });

    // Gate de plano: mesma regra de Pricing.tsx — fator regional só se aplica
    // pro plano pago, pra nunca mostrar um preço recomendado diferente do que
    // Pricing.tsx mostra pro mesmo usuário/receita.
    const effectiveRegionalFactor = profile?.plan === "paid" ? pricingConfig.regional_factor : 1.0;

    const { recommendedPrice } = calculateRecommendedPrice({
      recipeCost: breakdown.totalCost,
      profitMarginPercentage: pricingConfig.profit_margin_percentage,
      taxPercentage: pricingConfig.tax_percentage,
      regionalFactor: effectiveRegionalFactor,
    });

    // Pulando deliberadamente a cadeia calculateChannelPrice→netRevenue que o
    // comentário de calculateContributionMargin sugere como uso "típico": não
    // existe hoje uma comissão de canal configurada, só a taxa de entrega
    // (modelo aditivo, calculada abaixo via calculateDeliveryInclusivePrice).
    const { contributionMargin, contributionMarginPercentage } = calculateContributionMargin({
      netRevenuePerUnit: recommendedPrice,
      variableCostPerUnit: breakdown.totalCost,
    });

    const hasChannelFee = pricingConfig.delivery_fee_percentage > 0;
    const priceWithDelivery = hasChannelFee
      ? calculateDeliveryInclusivePrice({
          price: recommendedPrice,
          deliveryFeePercentage: pricingConfig.delivery_fee_percentage,
        }).priceWithDelivery
      : null;

    return {
      isLoading: loadingIngredients || loadingIndirectCosts || loadingConfig || loadingProfile,
      hasIngredients: ingredientLines.length > 0,
      hasChannelFee,
      ingredientLines,
      directCost: breakdown.ingredientsCost,
      wasteCost: breakdown.costWithWaste - breakdown.ingredientsCost,
      packagingCost: packagingCosts.reduce((sum, amount) => sum + amount, 0),
      otherIndirectCost: otherCosts.reduce((sum, amount) => sum + amount, 0),
      minimumPrice,
      recommendedPrice,
      estimatedMargin: contributionMargin,
      estimatedMarginPercentage: contributionMarginPercentage,
      priceWithDelivery,
      deliveryFeePercentage: pricingConfig.delivery_fee_percentage,
    };
  }, [
    recipeIngredients,
    recipeIndirectCosts,
    liveWastePercentage,
    pricingConfig,
    profile,
    loadingIngredients,
    loadingIndirectCosts,
    loadingConfig,
    loadingProfile,
  ]);

  return data;
}
