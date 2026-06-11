import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Tag, ChefHat, Building2, Calculator, ShoppingCart, CheckCircle } from "lucide-react";

type OnboardingStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  route?: string;
};

const steps: OnboardingStep[] = [
  {
    title: "Bem-vindo ao MenuWise! 🎉",
    description: "Vamos fazer um tour rápido pela ordem ideal de configuração para você ter o sistema funcionando por completo.",
    icon: <CheckCircle className="h-16 w-16 text-primary" />,
  },
  {
    title: "1. Cadastre seus Ingredientes",
    description: "Comece cadastrando todos os ingredientes que você usa, com seus custos unitários e fornecedores. Essa é a base de tudo.",
    icon: <Package className="h-16 w-16 text-primary" />,
    route: "/ingredients",
  },
  {
    title: "2. Organize em Categorias (opcional)",
    description: "Crie categorias para agrupar suas receitas (ex.: Bebidas, Sobremesas, Pizzas). Ajuda na organização do cardápio.",
    icon: <Tag className="h-16 w-16 text-primary" />,
    route: "/categories",
  },
  {
    title: "3. Crie suas Receitas",
    description: "Monte suas fichas técnicas combinando ingredientes e definindo quantidades, desperdício e tempo de preparo.",
    icon: <ChefHat className="h-16 w-16 text-primary" />,
    route: "/recipes",
  },
  {
    title: "4. Informe os Custos Indiretos",
    description: "Adicione custos como aluguel, energia e embalagens. Eles entram no cálculo do preço para garantir lucro real.",
    icon: <Building2 className="h-16 w-16 text-primary" />,
    route: "/indirect-costs",
  },
  {
    title: "5. Calcule Preços Inteligentes",
    description: "Use a calculadora para definir o preço ideal baseado em custos, margem de lucro, impostos e fator regional.",
    icon: <Calculator className="h-16 w-16 text-primary" />,
    route: "/pricing",
  },
  {
    title: "6. Registre suas Vendas",
    description: "Acompanhe vendas, lucro e desempenho. Pronto: seu sistema está configurado e funcionando por completo!",
    icon: <ShoppingCart className="h-16 w-16 text-primary" />,
    route: "/sales",
  },
];

const START_ROUTE = "/ingredients";

interface OnboardingProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Onboarding({ open: controlledOpen, onOpenChange }: OnboardingProps) {
  const navigate = useNavigate();
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  useEffect(() => {
    if (isControlled) return;
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setInternalOpen(true);
    }
  }, [isControlled]);

  // Reset to first step whenever the tour is reopened.
  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish(true);
    }
  };

  const handleSkip = () => {
    handleFinish(false);
  };

  const handleFinish = (navigateToStart: boolean) => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setOpen(false);
    if (navigateToStart) {
      // Always send the user to a valid starting point.
      const target = steps[currentStep]?.route ?? START_ROUTE;
      navigate(target);
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
