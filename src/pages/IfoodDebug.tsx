import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bug, Trash2, RefreshCw, Download, AlertCircle } from "lucide-react";

interface LogEntry {
  timestamp: string;
  type: "success" | "error" | "info" | "debug";
  message: string;
  data?: any;
}

interface Stats {
  created: number;
  received: number;
  avgLatency: number;
  successRate: number;
}

const IfoodDebug = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats>({
    created: 0,
    received: 0,
    avgLatency: 0,
    successRate: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [latencies, setLatencies] = useState<number[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Map<string, number>>(new Map());

  const addLog = (type: LogEntry["type"], message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR");
    setLogs((prev) => [{ timestamp, type, message, data }, ...prev].slice(0, 100));
  };

  const getLogIcon = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "info":
        return "ℹ️";
      case "debug":
        return "🔧";
    }
  };

  const setupRealtimeMonitor = () => {
    const channel = supabase
      .channel("ifood_debug_monitor")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ifood_orders",
        },
        (payload) => {
          const orderId = payload.new.ifood_order_id;
          const totalAmount = payload.new.total_amount;

          addLog("debug", "📥 INSERT recebido", {
            orderId,
            totalAmount,
          });

          // Calculate latency if this was a test order we created
          if (pendingOrders.has(orderId)) {
            const createdAt = pendingOrders.get(orderId)!;
            const latency = Date.now() - createdAt;
            setLatencies((prev) => [...prev, latency]);
            addLog("success", `Notificação recebida em ${latency}ms`, { orderId });
            
            // Remove from pending
            setPendingOrders((prev) => {
              const newMap = new Map(prev);
              newMap.delete(orderId);
              return newMap;
            });

            // Update stats
            setStats((prev) => {
              const received = prev.received + 1;
              const allLatencies = [...latencies, latency];
              const avgLatency = allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;
              const successRate = prev.created > 0 ? (received / prev.created) * 100 : 0;
              
              return {
                ...prev,
                received,
                avgLatency: Math.round(avgLatency),
                successRate: Math.round(successRate),
              };
            });
          }

          toast({
            title: "🛵 Novo Pedido!",
            description: `${orderId.slice(-8)} - R$ ${totalAmount.toFixed(2)}`,
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          addLog("success", "✅ Canal Realtime conectado");
        } else if (status === "CLOSED") {
          setIsConnected(false);
          addLog("error", "❌ Canal Realtime desconectado");
        }
      });

    return channel;
  };

  useEffect(() => {
    addLog("info", "🔧 Iniciando monitor de debug...");
    const channel = setupRealtimeMonitor();

    return () => {
      addLog("info", "🔌 Encerrando monitor...");
      supabase.removeChannel(channel);
    };
  }, [pendingOrders, latencies]);

  const generateTestOrder = (type: "simple" | "multiple" | "large" | "complex") => {
    const orderId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const baseOrder = {
      ifood_order_id: orderId,
      merchant_id: "TEST-MERCHANT",
      order_type: "DELIVERY",
      order_status: "PLACED",
      created_at_ifood: new Date().toISOString(),
      synced_to_sales: false,
      customer: {
        name: "Cliente Teste Debug",
        phone: "11999999999",
      },
      payments: [{ method: "CREDIT" }],
      delivery_address: {
        street: "Rua Teste",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
      },
    };

    switch (type) {
      case "simple":
        return {
          ...baseOrder,
          items: [{ name: "Pizza Margherita", quantity: 1, totalPrice: 45.0 }],
          sub_total: 45.0,
          delivery_fee: 5.0,
          total_amount: 50.0,
        };

      case "multiple":
        return {
          ...baseOrder,
          items: [
            { name: "X-Burger", quantity: 2, totalPrice: 60.0 },
            { name: "Batata Frita", quantity: 1, totalPrice: 15.0 },
            { name: "Refrigerante 2L", quantity: 1, totalPrice: 10.0 },
          ],
          sub_total: 85.0,
          delivery_fee: 8.0,
          total_amount: 93.0,
        };

      case "large":
        return {
          ...baseOrder,
          items: [
            { name: "Pizza Grande Premium", quantity: 3, totalPrice: 180.0 },
            { name: "Refrigerante 2L", quantity: 2, totalPrice: 20.0 },
          ],
          sub_total: 200.0,
          delivery_fee: 12.0,
          total_amount: 212.0,
        };

      case "complex":
        return {
          ...baseOrder,
          items: [
            { name: "Pizza Portuguesa", quantity: 1, totalPrice: 52.0 },
            { name: "Pizza 4 Queijos", quantity: 1, totalPrice: 55.0 },
            { name: "Esfiha (10 un)", quantity: 1, totalPrice: 28.0 },
            { name: "Batata Frita GG", quantity: 1, totalPrice: 18.0 },
            { name: "Refrigerante 2L", quantity: 2, totalPrice: 20.0 },
            { name: "Sorvete", quantity: 1, totalPrice: 15.0 },
          ],
          sub_total: 188.0,
          delivery_fee: 10.0,
          total_amount: 198.0,
        };
    }
  };

  const insertTestOrder = async (type: "simple" | "multiple" | "large" | "complex") => {
    setIsLoading(true);
    addLog("debug", `🔧 Criando pedido teste: ${type}`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const orderData = generateTestOrder(type);
      const createdAt = Date.now();

      // Track this order for latency calculation
      setPendingOrders((prev) => new Map(prev).set(orderData.ifood_order_id, createdAt));

      const { error } = await supabase.from("ifood_orders").insert({
        user_id: user.id,
        ...orderData,
      });

      if (error) throw error;

      setStats((prev) => ({
        ...prev,
        created: prev.created + 1,
      }));

      addLog("success", `✅ Pedido inserido: ${orderData.ifood_order_id.slice(-8)}`);
      
      toast({
        title: "✅ Pedido teste criado",
        description: `Total: R$ ${orderData.total_amount.toFixed(2)}`,
      });
    } catch (error: any) {
      addLog("error", `❌ Erro ao inserir: ${error.message}`);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const insertMultipleOrders = async () => {
    setIsLoading(true);
    addLog("debug", "🔧 Criando 3 pedidos simultâneos...");

    const types: Array<"simple" | "multiple" | "large"> = ["simple", "multiple", "large"];
    
    for (const type of types) {
      await insertTestOrder(type);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between orders
    }

    setIsLoading(false);
  };

  const clearTestOrders = async () => {
    setIsLoading(true);
    addLog("debug", "🗑️ Limpando pedidos teste...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error, count } = await supabase
        .from("ifood_orders")
        .delete()
        .eq("user_id", user.id)
        .like("ifood_order_id", "TEST-%");

      if (error) throw error;

      addLog("success", `✅ ${count || 0} pedidos removidos`);
      
      toast({
        title: "🗑️ Pedidos teste removidos",
        description: `${count || 0} registros deletados`,
      });

      // Reset stats
      setStats({
        created: 0,
        received: 0,
        avgLatency: 0,
        successRate: 0,
      });
      setLatencies([]);
      setPendingOrders(new Map());
    } catch (error: any) {
      addLog("error", `❌ Erro ao limpar: ${error.message}`);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog("info", "📋 Console limpo");
  };

  const exportLogs = () => {
    const logsText = logs
      .map((log) => `[${log.timestamp}] ${getLogIcon(log.type)} ${log.message}`)
      .join("\n");

    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ifood-debug-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    addLog("success", "✅ Logs exportados");
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bug className="h-8 w-8" />
              Debug iFood - Notificações Realtime
            </h1>
            <p className="text-muted-foreground">
              Ferramentas para testar e monitorar notificações em tempo real
            </p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta página cria pedidos de teste com prefixo <code className="font-mono">TEST-</code> para validar
            notificações em tempo real. Use os botões abaixo para simular diferentes cenários.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Status da Conexão */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Conexão</CardTitle>
              <CardDescription>Monitor Realtime do Supabase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                />
                <span className="font-medium">{isConnected ? "CONECTADO" : "DESCONECTADO"}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Canal: <code className="font-mono">ifood_debug_monitor</code>
              </div>
              <div className="text-sm text-muted-foreground">
                Tabela: <code className="font-mono">ifood_orders</code>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas da Sessão</CardTitle>
              <CardDescription>Métricas de performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{stats.created}</div>
                  <div className="text-xs text-muted-foreground">Pedidos Criados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.received}</div>
                  <div className="text-xs text-muted-foreground">Notificações Recebidas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.avgLatency}ms</div>
                  <div className="text-xs text-muted-foreground">Latência Média</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.successRate}%</div>
                  <div className="text-xs text-muted-foreground">Taxa de Sucesso</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações de Teste */}
        <Card>
          <CardHeader>
            <CardTitle>Ações de Teste</CardTitle>
            <CardDescription>Simule diferentes tipos de pedidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Button onClick={() => insertTestOrder("simple")} disabled={isLoading}>
                Pedido Simples (R$ 50)
              </Button>
              <Button onClick={() => insertTestOrder("multiple")} disabled={isLoading}>
                Pedido Múltiplos Itens (R$ 93)
              </Button>
              <Button onClick={() => insertTestOrder("large")} disabled={isLoading}>
                Pedido Grande (R$ 212)
              </Button>
              <Button onClick={() => insertTestOrder("complex")} disabled={isLoading}>
                Pedido Complexo (R$ 198)
              </Button>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button onClick={insertMultipleOrders} disabled={isLoading} variant="secondary" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                3 Pedidos Simultâneos
              </Button>
              <Button onClick={clearTestOrders} disabled={isLoading} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Pedidos Teste
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Console de Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Console de Logs (Realtime)</CardTitle>
                <CardDescription>Eventos recebidos em tempo real</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={exportLogs} size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
                <Button onClick={clearLogs} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum evento registrado ainda. Crie um pedido teste para começar.
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono">
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground">[{log.timestamp}]</span>
                        <span>{getLogIcon(log.type)}</span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                      {log.data && (
                        <div className="ml-20 text-xs text-muted-foreground">
                          {JSON.stringify(log.data, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default IfoodDebug;
