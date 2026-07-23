import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, TrendingDown, TrendingUp, Package, Trophy, DollarSign, Bell, ArrowRight } from "lucide-react";
import { useDashboardActiveInsights } from "@/hooks/useDashboardActiveInsights";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardAttentionPanel() {
  const navigate = useNavigate();
  const {
    isLoading,
    criticalMargin,
    ingredientCostAlerts,
    belowMinimumSales,
    lowStock,
    mostProfitable,
    repricingOpportunities,
    monthlyTrend,
  } = useDashboardActiveInsights();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>O que precisa da sua atenção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const recommendedActions: { label: string; route: string }[] = [];
  if (criticalMargin.length > 0) recommendedActions.push({ label: "Revisar preço das receitas com margem baixa", route: "/pricing" });
  if (repricingOpportunities.length > 0) recommendedActions.push({ label: "Reajustar preço de receitas com custo em alta", route: "/pricing" });
  if (lowStock.length > 0) recommendedActions.push({ label: "Repor ingredientes em falta", route: "/stock" });
  if (belowMinimumSales.length > 0) recommendedActions.push({ label: "Revisar vendas com desconto abaixo do custo", route: "/sales" });
  if (!ingredientCostAlerts.enabled) recommendedActions.push({ label: "Ativar alertas de aumento de custo de ingrediente", route: "/cost-alerts" });

  const hasAnyItem = criticalMargin.length > 0 || ingredientCostAlerts.items.length > 0 ||
    belowMinimumSales.length > 0 || lowStock.length > 0 || repricingOpportunities.length > 0 ||
    (monthlyTrend && (monthlyTrend.revenueChange < -10 || monthlyTrend.profitChange < -15));

  return (
    <Card className="border-primary/30 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          O que precisa da sua atenção
        </CardTitle>
        <CardDescription>Prato mais rentável e pontos que merecem revisão</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mostProfitable && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Trophy className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Prato mais rentável: {mostProfitable.name}</p>
              <p className="text-xs text-muted-foreground">R$ {mostProfitable.profit.toFixed(2)} de lucro nos últimos 30 dias</p>
            </div>
          </div>
        )}

        {!hasAnyItem ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Tudo certo por aqui — nenhum ponto crítico encontrado nos últimos 30 dias.
          </p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {criticalMargin.length > 0 && (
              <AccordionItem value="margin">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-sm">
                    <TrendingDown className="h-4 w-4 text-warning" />
                    Pratos com margem crítica
                    <Badge variant="secondary">{criticalMargin.length}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {criticalMargin.map((item) => (
                    <div key={item.recipeId} className="flex justify-between text-sm py-1">
                      <span>{item.name}</span>
                      <span className="text-warning font-medium">{item.marginPercentage.toFixed(1)}% margem</span>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}

            {ingredientCostAlerts.items.length > 0 && (
              <AccordionItem value="ingredient-cost">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-warning" />
                    Ingredientes que aumentaram de custo
                    <Badge variant="secondary">{ingredientCostAlerts.items.length}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {ingredientCostAlerts.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span>{item.name}</span>
                      <span className="text-warning font-medium">+{item.percentageChange.toFixed(1)}%</span>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}

            {repricingOpportunities.length > 0 && (
              <AccordionItem value="repricing">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-warning" />
                    Oportunidades de reajuste
                    <Badge variant="secondary">{repricingOpportunities.length}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {repricingOpportunities.map((item) => (
                    <div key={item.recipeId} className="flex justify-between text-sm py-1">
                      <span>{item.name}</span>
                      <span className="text-warning font-medium">custo +{item.costChangePercentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}

            {belowMinimumSales.length > 0 && (
              <AccordionItem value="below-minimum">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Vendas abaixo do preço mínimo
                    <Badge variant="destructive">{belowMinimumSales.length}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {belowMinimumSales.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span>{item.recipeName}</span>
                      <span className="text-destructive font-medium">R$ {item.loss.toFixed(2)}</span>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}

            {lowStock.length > 0 && (
              <AccordionItem value="low-stock">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-warning" />
                    Estoque baixo
                    <Badge variant="secondary">{lowStock.length}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {lowStock.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.currentQuantity} / {item.minQuantity} {item.unit}</span>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}

            {monthlyTrend && (monthlyTrend.revenueChange < -10 || monthlyTrend.profitChange < -15) && (
              <AccordionItem value="trend">
                <AccordionTrigger>
                  <span className="flex items-center gap-2 text-sm">
                    <TrendingDown className="h-4 w-4 text-warning" />
                    Tendência do mês
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-1 text-sm text-muted-foreground">
                  {monthlyTrend.revenueChange < -10 && <p>Vendas caíram {Math.abs(monthlyTrend.revenueChange).toFixed(1)}% este mês</p>}
                  {monthlyTrend.profitChange < -15 && <p>Lucro caiu {Math.abs(monthlyTrend.profitChange).toFixed(1)}% este mês</p>}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}

        {recommendedActions.length > 0 && (
          <div className="pt-2 space-y-2 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">Ações recomendadas</p>
            {recommendedActions.map((action) => (
              <Button
                key={action.route + action.label}
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => navigate(action.route)}
              >
                {action.label}
                <ArrowRight className="h-3 w-3" />
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
