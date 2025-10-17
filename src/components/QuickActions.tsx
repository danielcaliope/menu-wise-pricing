import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Package, ShoppingCart } from "lucide-react";

interface QuickActionsProps {
  hasIngredients: boolean;
  hasRecipes: boolean;
}

export function QuickActions({ hasIngredients, hasRecipes }: QuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    {
      icon: ShoppingCart,
      label: "Nova Venda",
      description: "Registrar venda rápida",
      onClick: () => navigate("/sales"),
      variant: "default" as const,
      enabled: hasRecipes,
      disabledMessage: "Crie receitas primeiro"
    },
    {
      icon: Package,
      label: "Novo Ingrediente",
      description: "Adicionar ao estoque",
      onClick: () => navigate("/ingredients"),
      variant: "outline" as const,
      enabled: true
    },
    {
      icon: TrendingUp,
      label: "Calcular Preço",
      description: "Precificar receita",
      onClick: () => navigate("/pricing"),
      variant: "outline" as const,
      enabled: hasIngredients && hasRecipes,
      disabledMessage: hasIngredients ? "Crie receitas primeiro" : "Cadastre ingredientes primeiro"
    },
    {
      icon: Plus,
      label: "Nova Receita",
      description: "Criar ficha técnica",
      onClick: () => navigate("/recipes"),
      variant: "outline" as const,
      enabled: hasIngredients,
      disabledMessage: "Cadastre ingredientes primeiro"
    }
  ];

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Ações Rápidas
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant={action.variant}
                className="h-auto flex-col items-start p-4 gap-2 hover-scale"
                onClick={action.onClick}
                disabled={!action.enabled}
                title={!action.enabled ? action.disabledMessage : undefined}
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold text-sm">{action.label}</div>
                  <div className="text-xs font-normal opacity-80">
                    {!action.enabled && action.disabledMessage ? action.disabledMessage : action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
