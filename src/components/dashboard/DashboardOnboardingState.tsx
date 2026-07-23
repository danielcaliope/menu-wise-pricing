import { Sparkles } from "lucide-react";
import { SetupProgress } from "@/components/SetupProgress";

// Estado 1 do Dashboard — conta sem configuração. Mostra SOMENTE progresso +
// próxima ação + botão + valor do sistema, conforme pedido. Nada mais monta
// nesta tela (sem QuickActions, sem stats, sem análises avançadas).
export function DashboardOnboardingState() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="text-center space-y-2">
        <Sparkles className="h-8 w-8 mx-auto text-primary" />
        <h1 className="text-2xl font-bold">Bem-vindo ao MenuWise</h1>
        <p className="text-muted-foreground">
          Em poucos passos você monta suas receitas, calcula o custo real de cada prato e
          descobre o preço ideal pra vender com margem — sem precisar de planilha.
        </p>
      </div>
      <SetupProgress />
    </div>
  );
}
