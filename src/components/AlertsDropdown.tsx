import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AlertsDropdown() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAlerts();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cost_alert_history'
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("cost_alert_history")
      .select("*")
      .eq("user_id", session.user.id)
      .order("triggered_at", { ascending: false })
      .limit(5);

    if (data) {
      setAlerts(data);
      setUnreadCount(data.filter(a => !a.is_read).length);
    }
  };

  const markAsRead = async (alertId: string) => {
    await supabase
      .from("cost_alert_history")
      .update({ is_read: true })
      .eq("id", alertId);
    
    fetchAlerts();
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'ingredient_price_increase':
        return 'Aumento de Preço';
      case 'recipe_cost_increase':
        return 'Aumento de Custo';
      case 'margin_drop':
        return 'Queda de Margem';
      default:
        return type;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Alertas</h3>
          {alerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/cost-alerts")}
              className="text-xs h-auto py-1 px-2"
            >
              Ver todos
            </Button>
          )}
        </div>
        
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhum alerta recente
          </div>
        ) : (
          alerts.map((alert) => (
            <DropdownMenuItem
              key={alert.id}
              className={`p-3 cursor-pointer flex-col items-start gap-2 ${
                !alert.is_read ? 'bg-muted/50' : ''
              }`}
              onClick={() => {
                markAsRead(alert.id);
                navigate("/cost-alerts");
              }}
            >
              <div className="flex items-start justify-between w-full gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">
                      {alert.reference_name}
                    </p>
                    <Badge
                      variant={alert.percentage_change > 0 ? "destructive" : "default"}
                      className="text-xs flex-shrink-0"
                    >
                      {alert.percentage_change > 0 ? '+' : ''}
                      {alert.percentage_change.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {getAlertTypeLabel(alert.alert_type)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    De R$ {Number(alert.old_value).toFixed(2)} para R$ {Number(alert.new_value).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(alert.triggered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
