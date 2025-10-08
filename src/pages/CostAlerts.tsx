import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, TrendingUp, DollarSign, AlertTriangle, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CostAlerts = () => {
  const queryClient = useQueryClient();
  const [editingThresholds, setEditingThresholds] = useState<Record<string, number>>({});

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["cost-alerts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("cost_alerts")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
  });

  const { data: alertHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["cost-alert-history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("cost_alert_history")
        .select("*")
        .eq("user_id", user.id)
        .order("triggered_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const upsertAlertMutation = useMutation({
    mutationFn: async ({ alertType, enabled, threshold }: { alertType: string; enabled: boolean; threshold?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const updateData: any = { enabled };
      if (threshold !== undefined) {
        updateData.threshold_percentage = threshold;
      }

      const { error } = await supabase
        .from("cost_alerts")
        .upsert({
          user_id: user.id,
          alert_type: alertType,
          ...updateData,
        }, {
          onConflict: 'user_id,alert_type'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-alerts"] });
      toast({
        title: "Alerta atualizado",
        description: "Suas configurações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar alerta:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (historyId: string) => {
      const { error } = await supabase
        .from("cost_alert_history")
        .update({ is_read: true })
        .eq("id", historyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-alert-history"] });
    },
  });

  const getAlertConfig = (alertType: string) => {
    return alerts?.find(a => a.alert_type === alertType);
  };

  const handleToggleAlert = (alertType: string, currentEnabled: boolean) => {
    upsertAlertMutation.mutate({
      alertType,
      enabled: !currentEnabled,
    });
  };

  const handleUpdateThreshold = (alertType: string) => {
    const threshold = editingThresholds[alertType];
    if (threshold !== undefined && threshold > 0) {
      upsertAlertMutation.mutate({
        alertType,
        enabled: getAlertConfig(alertType)?.enabled ?? true,
        threshold,
      });
      setEditingThresholds(prev => {
        const newState = { ...prev };
        delete newState[alertType];
        return newState;
      });
    }
  };

  const alertTypes = [
    {
      type: "ingredient_price_increase",
      title: "Aumento no Preço de Ingredientes",
      description: "Notificar quando o preço de um ingrediente aumentar acima do limite",
      icon: TrendingUp,
    },
    {
      type: "recipe_cost_increase",
      title: "Aumento no Custo de Receitas",
      description: "Notificar quando o custo de uma receita aumentar acima do limite",
      icon: DollarSign,
    },
    {
      type: "margin_drop",
      title: "Queda na Margem de Lucro",
      description: "Notificar quando a margem de lucro cair abaixo do limite",
      icon: AlertTriangle,
    },
  ];

  const getAlertTypeLabel = (type: string) => {
    const alertType = alertTypes.find(a => a.type === type);
    return alertType?.title || type;
  };

  if (alertsLoading || historyLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando alertas...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alertas de Custos</h1>
        <p className="text-muted-foreground mt-2">
          Configure notificações para variações nos custos de ingredientes e receitas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Alertas
          </CardTitle>
          <CardDescription>
            Defina quando você deseja ser notificado sobre mudanças nos custos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {alertTypes.map((alertType) => {
            const config = getAlertConfig(alertType.type);
            const Icon = alertType.icon;
            const isEditing = editingThresholds[alertType.type] !== undefined;
            const currentThreshold = isEditing
              ? editingThresholds[alertType.type]
              : config?.threshold_percentage ?? 10;

            return (
              <div key={alertType.type} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{alertType.title}</h3>
                        <Switch
                          checked={config?.enabled ?? false}
                          onCheckedChange={() =>
                            handleToggleAlert(alertType.type, config?.enabled ?? false)
                          }
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alertType.description}
                      </p>
                    </div>
                  </div>
                </div>

                {config?.enabled && (
                  <div className="ml-8 flex items-end gap-2">
                    <div className="flex-1 max-w-xs">
                      <Label htmlFor={`threshold-${alertType.type}`}>
                        Limite de variação (%)
                      </Label>
                      <Input
                        id={`threshold-${alertType.type}`}
                        type="number"
                        min="0"
                        step="1"
                        value={currentThreshold}
                        onChange={(e) =>
                          setEditingThresholds(prev => ({
                            ...prev,
                            [alertType.type]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    {isEditing && (
                      <Button
                        onClick={() => handleUpdateThreshold(alertType.type)}
                        size="sm"
                      >
                        Salvar
                      </Button>
                    )}
                  </div>
                )}

                <Separator />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alertas</CardTitle>
          <CardDescription>
            Últimas notificações de variações de custos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!alertHistory || alertHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum alerta registrado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {alertHistory.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start justify-between p-4 rounded-lg border ${
                    item.is_read ? "bg-background" : "bg-muted/50"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.reference_name}</p>
                      <Badge
                        variant={item.percentage_change > 0 ? "destructive" : "default"}
                      >
                        {item.percentage_change > 0 ? "+" : ""}
                        {item.percentage_change.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getAlertTypeLabel(item.alert_type)}
                    </p>
                    <p className="text-sm">
                      De R$ {parseFloat(item.old_value.toString()).toFixed(2)} para R${" "}
                      {parseFloat(item.new_value.toString()).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.triggered_at), "PPp", { locale: ptBR })}
                    </p>
                  </div>
                  {!item.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsReadMutation.mutate(item.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
};

export default CostAlerts;
