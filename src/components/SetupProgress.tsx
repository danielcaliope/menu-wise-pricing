import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";

export function SetupProgress() {
  const navigate = useNavigate();
  const { steps, completedCount, totalSteps, isComplete, nextStep, isLoading } = useOnboardingProgress();

  if (isLoading || isComplete) {
    return null;
  }

  const progress = (completedCount / totalSteps) * 100;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Configuração Inicial</h3>
              <span className="text-sm font-medium text-muted-foreground">
                {completedCount}/{totalSteps} concluídas
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Siga a ordem abaixo até ver o preço recomendado da sua primeira receita.
            </p>
          </div>

          <div className="space-y-2">
            {steps.map((step, index) => {
              const Icon = step.completed ? CheckCircle2 : Circle;
              const isNext = nextStep?.key === step.key;

              return (
                <div
                  key={step.key}
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
                    <p className="text-sm font-medium">
                      {index + 1}. {step.completed ? step.doneLabel : step.pendingLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
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
