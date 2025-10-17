import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb } from "lucide-react";

interface WeeklyInsightsProps {
  monthlyComparison: {
    currentRevenue: number;
    currentProfit: number;
    lastRevenue: number;
    lastProfit: number;
    revenueChange: number;
    profitChange: number;
  } | null;
  topSellingRecipes: any[];
  averageMargin: number;
}

export function WeeklyInsights({ 
  monthlyComparison, 
  topSellingRecipes,
  averageMargin 
}: WeeklyInsightsProps) {
  const navigate = useNavigate();

  if (!monthlyComparison) return null;

  const insights = [];

  // Insight sobre mudança de receita
  if (monthlyComparison.revenueChange < -10) {
    insights.push({
      type: "warning",
      icon: TrendingDown,
      title: "Vendas em queda",
      message: `Suas vendas caíram ${Math.abs(monthlyComparison.revenueChange).toFixed(1)}% este mês`,
      action: "Ver Relatório de Vendas",
      route: "/reports"
    });
  } else if (monthlyComparison.revenueChange > 15) {
    insights.push({
      type: "success",
      icon: TrendingUp,
      title: "Vendas em alta! 🎉",
      message: `Suas vendas aumentaram ${monthlyComparison.revenueChange.toFixed(1)}% este mês`,
      action: "Ver Análise",
      route: "/reports"
    });
  }

  // Insight sobre margem
  if (averageMargin < 20) {
    insights.push({
      type: "warning",
      icon: AlertCircle,
      title: "Margem baixa",
      message: `Sua margem média está em ${averageMargin.toFixed(1)}%. Considere revisar preços`,
      action: "Recalcular Preços",
      route: "/pricing"
    });
  }

  // Insight sobre receita mais vendida
  if (topSellingRecipes.length > 0) {
    const topRecipe = topSellingRecipes[0];
    insights.push({
      type: "info",
      icon: Lightbulb,
      title: "Produto destaque",
      message: `"${topRecipe.name}" é sua receita mais vendida com ${topRecipe.quantidade} unidades`,
      action: "Ver Receitas",
      route: "/recipes"
    });
  }

  // Insight sobre lucro
  if (monthlyComparison.profitChange < -15) {
    insights.push({
      type: "warning",
      icon: TrendingDown,
      title: "Lucro em queda",
      message: `Seu lucro caiu ${Math.abs(monthlyComparison.profitChange).toFixed(1)}%. Revise custos`,
      action: "Analisar Custos",
      route: "/ingredients"
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "success",
      icon: TrendingUp,
      title: "Tudo certo!",
      message: "Seu negócio está estável. Continue acompanhando os indicadores",
      action: "Ver Dashboard",
      route: "/dashboard"
    });
  }

  return (
    <Card className="border-accent shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Insights da Semana
        </CardTitle>
        <CardDescription>
          Análise inteligente do seu negócio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.slice(0, 3).map((insight, index) => {
          const Icon = insight.icon;
          const bgColor = 
            insight.type === "warning" ? "bg-warning/10 border-warning/30" :
            insight.type === "success" ? "bg-primary/10 border-primary/30" :
            "bg-accent border-accent";

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${bgColor} transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  insight.type === "warning" ? "text-warning" :
                  insight.type === "success" ? "text-primary" :
                  "text-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-1">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {insight.message}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(insight.route)}
                    className="h-auto p-0 text-xs hover:underline"
                  >
                    {insight.action} →
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
