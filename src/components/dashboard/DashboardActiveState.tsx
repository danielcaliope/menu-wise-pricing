import { useIngredients } from "@/hooks/useIngredients";
import { useRecipes } from "@/hooks/useRecipes";
import { QuickActions } from "@/components/QuickActions";
import { DashboardAttentionPanel } from "./DashboardAttentionPanel";

// Estado 3 do Dashboard — operação ativa (2+ receitas próprias). Prioriza o
// que precisa de atenção em vez de métricas soltas.
export function DashboardActiveState() {
  const { ingredients } = useIngredients();
  const { recipes } = useRecipes();

  return (
    <div className="space-y-6 animate-fade-in">
      <QuickActions hasIngredients={ingredients.length > 0} hasRecipes={recipes.length > 0} />
      <DashboardAttentionPanel />
    </div>
  );
}
