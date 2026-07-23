import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIngredients } from "./useIngredients";
import { useRecipes } from "./useRecipes";
import { usePricingConfig } from "./usePricingConfig";

export type OnboardingStep = {
  key: string;
  label: string;
  doneLabel: string;
  pendingLabel: string;
  completed: boolean;
  route: string;
  description: string;
};

async function fetchHasLocation(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("location_city, location_state, location_cep")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return false;
  return !!(data.location_city && data.location_state && data.location_cep);
}

async function fetchHasIndirectCosts(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { count, error } = await supabase
    .from("indirect_costs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return false;
  return (count ?? 0) > 0;
}

async function fetchHasPricingHistory(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { count, error } = await supabase
    .from("pricing_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) return false;
  return (count ?? 0) > 0;
}

export function useOnboardingProgress() {
  const { ingredients, isLoading: loadingIngredients } = useIngredients();
  const { recipes, isLoading: loadingRecipes } = useRecipes();
  const { hasSavedConfig, isLoading: loadingConfig } = usePricingConfig();

  const { data: hasLocation, isLoading: loadingLocation } = useQuery({
    queryKey: ["onboarding-has-location"],
    queryFn: fetchHasLocation,
  });
  const { data: hasIndirectCosts, isLoading: loadingIndirectCosts } = useQuery({
    queryKey: ["onboarding-has-indirect-costs"],
    queryFn: fetchHasIndirectCosts,
  });
  const { data: hasPricingHistory, isLoading: loadingPricingHistory } = useQuery({
    queryKey: ["onboarding-has-pricing-history"],
    queryFn: fetchHasPricingHistory,
  });

  const isLoading = loadingIngredients || loadingRecipes || loadingConfig ||
    loadingLocation || loadingIndirectCosts || loadingPricingHistory;

  const steps: OnboardingStep[] = [
    {
      key: "establishment",
      label: "Informações do estabelecimento",
      doneLabel: "Estabelecimento configurado",
      pendingLabel: "Estabelecimento pendente",
      completed: !!hasLocation,
      route: "/settings",
      description: "Preencha cidade, estado e CEP do seu estabelecimento",
    },
    {
      key: "costs",
      label: "Custos principais da operação",
      doneLabel: "Custos cadastrados",
      pendingLabel: "Custos pendentes",
      completed: !!hasIndirectCosts,
      route: "/indirect-costs",
      description: "Cadastre aluguel, energia e outros custos fixos",
    },
    {
      key: "channel",
      label: "Canal de venda e taxas",
      doneLabel: "Canal de venda configurado",
      pendingLabel: "Canal de venda pendente",
      completed: hasSavedConfig,
      route: "/pricing",
      description: "Configure margem, impostos e taxa de entrega",
    },
    {
      key: "ingredient",
      label: "Primeiro ingrediente",
      doneLabel: "Primeiro ingrediente cadastrado",
      pendingLabel: "Primeiro ingrediente pendente",
      completed: ingredients.length > 0,
      route: "/ingredients",
      description: "Cadastre o primeiro ingrediente que você usa",
    },
    {
      key: "recipe",
      label: "Primeira receita",
      doneLabel: "Primeira receita criada",
      pendingLabel: "Primeira receita pendente",
      completed: recipes.length > 0,
      route: "/recipes",
      description: "Monte a ficha técnica do seu primeiro prato",
    },
    {
      key: "price",
      label: "Primeiro preço recomendado",
      doneLabel: "Primeiro preço recomendado calculado",
      pendingLabel: "Primeiro preço recomendado pendente",
      completed: !!hasPricingHistory,
      route: "/pricing",
      description: "Calcule e salve o preço de uma receita",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const isComplete = completedCount === totalSteps;
  const nextStep = steps.find((s) => !s.completed);

  return { steps, completedCount, totalSteps, isComplete, nextStep, isLoading };
}
