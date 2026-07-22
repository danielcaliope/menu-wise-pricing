/**
 * Tipos do módulo de domínio de precificação.
 *
 * Deliberadamente desacoplados do schema do Supabase (Database["public"]["Tables"])
 * — este módulo não conhece React, Supabase nem estado de UI. Quem chama é
 * responsável por mapear os dados carregados pros formatos abaixo.
 */

export interface IngredientLine {
  quantity: number;
  unitCost: number;
}

export interface RecipeCostInput {
  ingredients: IngredientLine[];
  wastePercentage: number;
  indirectCosts: number[];
}

export interface RecipeCostBreakdown {
  ingredientsCost: number;
  costWithWaste: number;
  indirectCostsTotal: number;
  totalCost: number;
}

export interface ChannelFee {
  percentage?: number;
  fixed?: number;
}

export interface ChannelPriceInput {
  price: number;
  fee?: ChannelFee;
}

export interface ChannelPriceResult {
  grossPrice: number;
  feeAmount: number;
  netRevenue: number;
}

export interface FixedCostAllocationInput {
  totalFixedCosts: number;
  estimatedVolume: number;
}

export interface ContributionMarginInput {
  netRevenuePerUnit: number;
  variableCostPerUnit: number;
}

export interface ContributionMarginResult {
  contributionMargin: number;
  contributionMarginPercentage: number;
}

export interface BreakEvenPriceInput {
  variableCostPerUnit: number;
  fixedCostPerUnit: number;
}

export interface RecommendedPriceInput {
  recipeCost: number;
  profitMarginPercentage: number;
  taxPercentage: number;
  regionalFactor: number;
}

export interface RecommendedPriceResult {
  costWithProfit: number;
  costWithTax: number;
  recommendedPrice: number;
}

export interface DeliveryInclusivePriceInput {
  price: number;
  deliveryFeePercentage: number;
}

export interface DeliveryInclusivePriceResult {
  price: number;
  deliveryFeePercentage: number;
  feeAmount: number;
  priceWithDelivery: number;
}
