import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface SetupProgressProps {
  hasIngredients: boolean;
  hasRecipes: boolean;
  hasIndirectCosts?: boolean;
  hasPricings: boolean;
  hasSales: boolean;
}

export function SetupProgress({
  hasIngredients,
  hasRecipes,
  hasIndirectCosts = false,
  hasPricings,
  hasSales,
}: SetupProgressProps) {
  const navigate = useNavigate();

  const steps = [
    {
      label: "1. Cadastrar ingredientes",
      completed: hasIngredients,
      route: "/ingredients",
      description: "Adicione os ingredientes que você usa",
      optional: false,
      disabled: false,
    },
    {
      label: "2. Criar receitas",
      completed: hasRecipes,
      route: "/recipes",
      description: "Monte as fichas técnicas dos seus produtos",
      optional: false,
      disabled: !hasIngredients,
    },
    {
      label: "3. Informar custos indiretos",
      completed: hasIndirectCosts,
      route: "/indirect-costs",
      description: "Aluguel, energia e embalagens (opcional, mas recomendado)",
      optional: true,
      disabled: !hasRecipes,
    },
    {
      label: "4. Calcular preços",
      completed: hasPricings,
      route: "/pricing",
      description: "Defina os preços de venda ideais",
      optional: false,
      disabled: !hasRecipes,
    },
    {
      label: "5. Registrar vendas",
      completed: hasSales,
      route: "/sales",
      description: "Acompanhe suas vendas e lucros",
      optional: false,
      disabled: !hasPricings,
    },
  ];

  // Required steps drive the progress bar; the optional step is shown but
  // doesn't block "completion" of the initial setup.
  const requiredSteps = steps.filter((s) => !s.optional);
  const completedRequired = requiredSteps.filter((s) => s.completed).length;
  const progress = (completedRequired / requiredSteps.length) * 100;
  const nextStep = steps.find((s) => !s.completed && !s.disabled);

  if (completedRequired === requiredSteps.length) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Configuração Inicial</h3>
              <span className="text-sm font-medium text-muted-foreground">
                {completedRequired}/{requiredSteps.length} concluído
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Siga a ordem abaixo para deixar o sistema funcionando por completo.
            </p>
          </div>

          <div className="space-y-2">
            {steps.map((step, index) => {
              const Icon = step.completed ? CheckCircle2 : Circle;
              const isNext = nextStep?.label === step.label;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isNext
                      ? "bg-primary/10 border border-primary/30"
                      : step.completed
                      ? "bg-muted/50"
                      : "opacity-60"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      step.completed ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2">
                      {step.label}
                      {step.optional && (
                        <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          Opcional
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {isNext && (
                    <Button
                      size="sm"
                      onClick={() => navigate(step.route)}
                      className="flex-shrink-0 gap-1"
                    >
                      Começar
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
