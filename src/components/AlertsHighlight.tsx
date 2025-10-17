import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Bell, ArrowRight } from "lucide-react";

interface AlertsHighlightProps {
  unreadAlerts: number;
  lowStockCount: number;
  recentAlerts: any[];
}

export function AlertsHighlight({ unreadAlerts, lowStockCount, recentAlerts }: AlertsHighlightProps) {
  const navigate = useNavigate();

  if (unreadAlerts === 0 && lowStockCount === 0) {
    return null;
  }

  const criticalAlerts = recentAlerts.filter(alert => 
    !alert.is_read && Math.abs(alert.percentage_change) >= 15
  ).slice(0, 2);

  return (
    <Card className="border-destructive/50 bg-destructive/5 shadow-lg animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Bell className="h-5 w-5 text-destructive animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Alertas Importantes
                <Badge variant="destructive" className="animate-scale-in">
                  {unreadAlerts + lowStockCount}
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Requer sua atenção
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/cost-alerts")}
            className="gap-2"
          >
            Ver Todos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {lowStockCount > 0 && (
            <div 
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-warning cursor-pointer hover:bg-accent transition-colors"
              onClick={() => navigate("/stock")}
            >
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Estoque Baixo</p>
                <p className="text-xs text-muted-foreground">
                  {lowStockCount} {lowStockCount === 1 ? 'ingrediente precisa' : 'ingredientes precisam'} de reposição
                </p>
              </div>
              <Badge variant="outline" className="flex-shrink-0">{lowStockCount}</Badge>
            </div>
          )}

          {criticalAlerts.map((alert) => (
            <div 
              key={alert.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-destructive/30 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => navigate("/cost-alerts")}
            >
              <TrendingDown className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{alert.reference_name}</p>
                <p className="text-xs text-muted-foreground">
                  {alert.alert_type === 'ingredient_price_increase' && 'Preço aumentou '}
                  {alert.alert_type === 'recipe_cost_increase' && 'Custo aumentou '}
                  {alert.alert_type === 'margin_drop' && 'Margem caiu '}
                  {Math.abs(alert.percentage_change).toFixed(1)}%
                </p>
              </div>
              <Badge variant="destructive" className="flex-shrink-0">
                {alert.percentage_change > 0 ? '+' : ''}{alert.percentage_change.toFixed(1)}%
              </Badge>
            </div>
          ))}

          {unreadAlerts > criticalAlerts.length && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              onClick={() => navigate("/cost-alerts")}
            >
              Ver mais {unreadAlerts - criticalAlerts.length} {unreadAlerts - criticalAlerts.length === 1 ? 'alerta' : 'alertas'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
