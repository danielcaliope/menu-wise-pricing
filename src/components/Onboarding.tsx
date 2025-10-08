import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, ChefHat, Calculator, CheckCircle } from "lucide-react";

type OnboardingStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  route?: string;
};

const steps: OnboardingStep[] = [
  {
    title: "Bem-vindo ao MenuWise! 🎉",
    description: "Vamos fazer um tour rápido para você aproveitar ao máximo o sistema de precificação inteligente.",
    icon: <CheckCircle className="h-16 w-16 text-primary" />,
  },
  {
    title: "1. Cadastre seus Ingredientes",
    description: "Comece cadastrando todos os ingredientes que você usa, com seus custos unitários e fornecedores.",
    icon: <Package className="h-16 w-16 text-primary" />,
    route: "/ingredients",
  },
  {
    title: "2. Crie suas Receitas",
    description: "Monte suas receitas combinando ingredientes e definindo quantidades. Adicione porcentagem de desperdício e tempo de preparo.",
    icon: <ChefHat className="h-16 w-16 text-primary" />,
    route: "/recipes",
  },
  {
    title: "3. Calcule Preços Inteligentes",
    description: "Use nossa calculadora para definir o preço ideal baseado em custos, margem de lucro, impostos e fator regional.",
    icon: <Calculator className="h-16 w-16 text-primary" />,
    route: "/pricing",
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has already seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setOpen(false);
    // Navigate to ingredients to start
    if (steps[currentStep].route) {
      navigate(steps[currentStep].route);
    }
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4 animate-scale-in">
            {step.icon}
          </div>
          <DialogTitle className="text-center text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-primary"
                  : index < currentStep
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSkip} className="flex-1">
            {isLastStep ? "Fechar" : "Pular Tour"}
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {isLastStep ? "Começar!" : "Próximo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
