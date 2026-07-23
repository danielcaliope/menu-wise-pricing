import { useOnboardingProgress } from "./useOnboardingProgress";
import { useRecipes } from "@/features/recipes/api";

export type DashboardState = "loading" | "onboarding" | "starting" | "active";

// Estado 2 → 3: muda depois da 2ª receita (a 1ª é feita durante o onboarding,
// a 2ª comprova que o usuário já opera sozinho, sem ajuda do checklist).
//
// Limitação aceita: como `recipes.length` e `isComplete` são recalculados ao
// vivo (sem "memória" de ordem), um usuário que cria várias receitas antes de
// terminar as outras etapas do onboarding pula direto de 'onboarding' pra
// 'active' na primeira vez que abre o Dashboard, sem passar por 'starting'.
// Resultado é ver um estado mais completo mais cedo, não um estado quebrado —
// não vale a pena resolver isso com uma tabela nova de "onboarding_completed_at"
// só pra esse caso de borda.
const RECIPES_NEEDED_FOR_ACTIVE = 2;

export function useDashboardState(): DashboardState {
  const { isComplete, isLoading: loadingOnboarding } = useOnboardingProgress();
  const { recipes, isLoading: loadingRecipes } = useRecipes();

  if (loadingOnboarding || loadingRecipes) return "loading";
  if (!isComplete) return "onboarding";
  return recipes.length >= RECIPES_NEEDED_FOR_ACTIVE ? "active" : "starting";
}
