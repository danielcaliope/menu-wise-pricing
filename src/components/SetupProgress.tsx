import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface SetupProgressProps {
  hasIngredients: boolean;
  hasRecipes: boolean;
  hasPricings: boolean;
  hasSales: boolean;
}

export function SetupProgress({ 
  hasIngredients, 
  hasRecipes, 
  hasPricings, 
  hasSales 
}: SetupProgressProps) {
  const navigate = useNavigate();

  const steps = [
    { 
      label: "Cadastrar ingredientes", 
      completed: hasIngredients,
      route: "/ingredients",
      description: "Adicione os ingredientes que você usa"
    },
    { 
      label: "Criar receitas", 
      completed: hasRecipes,
      route: "/recipes",
      description: "Monte as fichas técnicas dos seus produtos",
      disabled: !hasIngredients
    },
    { 
      label: "Calcular preços", 
      completed: hasPricings,
      route: "/pricing",
      description: "Defina os preços de venda ideais",
      disabled: !hasRecipes
    },
    { 
      label: "Registrar vendas", 
      completed: hasSales,
      route: "/sales",
      description: "Acompanhe suas vendas e lucros",
      disabled: !hasPricings
    }
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;
  const nextStep = steps.find(s => !s.completed && !s.disabled);

  if (completedSteps === steps.length) {
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
                {completedSteps}/{steps.length} concluído
              </span>
            </div>
            <Progress value={progress} className="h-2" />
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
                      ? 'bg-primary/10 border border-primary/30' 
                      : step.completed 
                      ? 'bg-muted/50' 
                      : 'opacity-60'
                  }`}
                >
                  <Icon 
                    className={`h-5 w-5 flex-shrink-0 ${
                      step.completed ? 'text-primary' : 'text-muted-foreground'
                    }`} 
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${step.disabled ? 'line-through' : ''}`}>
                      {step.label}
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
