import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, RefreshCw, Package, User, MapPin, ShoppingCart, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IfoodProductMapping } from "@/components/IfoodProductMapping";

export default function IfoodOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingToSales, setSyncingToSales] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [unmappedProducts, setUnmappedProducts] = useState<string[]>([]);

  useEffect(() => {
    loadOrders();

    // Setup realtime subscription for new orders
    const channel = supabase
      .channel('ifood_orders_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ifood_orders'
        },
        (payload) => {
          console.log('New iFood order received:', payload);
          
          // Show toast notification
          toast({
            title: "🛵 Novo Pedido iFood!",
            description: `Pedido #${payload.new.ifood_order_id.slice(-8)} - R$ ${payload.new.total_amount.toFixed(2)}`,
          });
          
          // Reload orders to show the new one
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ifood_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at_ifood', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const { data, error } = await supabase.functions.invoke('ifood-sync-orders');

      if (error) throw error;

      toast({
        title: "Sincronizado!",
        description: `${data.newOrders} novos pedidos`,
      });

      await loadOrders();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao sincronizar",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PLACED': 'bg-blue-500',
      'CONFIRMED': 'bg-green-500',
      'READY_TO_PICKUP': 'bg-yellow-500',
      'DISPATCHED': 'bg-purple-500',
      'DELIVERED': 'bg-green-600',
      'CANCELLED': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const checkUnmappedProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all unique product names from orders
      const productNames = new Set<string>();
      orders.forEach(order => {
        order.items.forEach((item: any) => {
          productNames.add(item.name);
        });
      });

      // Get existing mappings
      const { data: mappings } = await supabase
        .from('ifood_product_mappings')
        .select('product_name')
        .eq('user_id', user.id);

      const mappedProducts = new Set(mappings?.map(m => m.product_name) || []);
      const unmapped = Array.from(productNames).filter(name => !mappedProducts.has(name));
      
      return unmapped;
    } catch (error) {
      console.error('Error checking unmapped products:', error);
      return [];
    }
  };

  const handleSyncToSales = async () => {
    // Check for unmapped products first
    const unmapped = await checkUnmappedProducts();
    
    if (unmapped.length > 0) {
      setUnmappedProducts(unmapped);
      setMappingDialogOpen(true);
      return;
    }

    await syncOrdersToSales();
  };

  const syncOrdersToSales = async () => {
    setSyncingToSales(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Get orders not synced yet
      const ordersToSync = orders.filter(o => !o.synced_to_sales);
      
      if (ordersToSync.length === 0) {
        toast({
          title: "Nenhum pedido para sincronizar",
          description: "Todos os pedidos já foram sincronizados",
        });
        return;
      }

      // Get mappings
      const { data: mappings } = await supabase
        .from('ifood_product_mappings')
        .select('product_name, recipe_id')
        .eq('user_id', user.id);

      const mappingMap = new Map(mappings?.map(m => [m.product_name, m.recipe_id]));

      // Get pricing for all recipes
      const recipeIds = Array.from(new Set(mappings?.map(m => m.recipe_id)));
      const { data: pricingData } = await supabase
        .from('pricing_history')
        .select('recipe_id, recipe_cost, price_with_delivery, price_without_delivery')
        .eq('user_id', user.id)
        .in('recipe_id', recipeIds);

      const pricingMap = new Map(
        pricingData?.map(p => [p.recipe_id, p])
      );

      let syncedCount = 0;
      let errorCount = 0;

      // Process each order
      for (const order of ordersToSync) {
        try {
          // Process each item in the order
          for (const item of order.items) {
            const recipeId = mappingMap.get(item.name);
            if (!recipeId) {
              console.warn(`No mapping found for product: ${item.name}`);
              errorCount++;
              continue;
            }

            const pricing = pricingMap.get(recipeId);
            if (!pricing) {
              console.warn(`No pricing found for recipe: ${recipeId}`);
              errorCount++;
              continue;
            }

            const hasDelivery = order.delivery_fee > 0;
            const costPerUnit = pricing.recipe_cost;
            const unitPrice = item.unitPrice || (item.totalPrice / item.quantity);
            const totalCost = costPerUnit * item.quantity;
            const totalAmount = item.totalPrice;
            const profit = totalAmount - totalCost;

            // Insert into sales
            const { error: salesError } = await supabase
              .from('sales')
              .insert({
                user_id: user.id,
                recipe_id: recipeId,
                quantity: item.quantity,
                unit_price: unitPrice,
                total_amount: totalAmount,
                cost_per_unit: costPerUnit,
                total_cost: totalCost,
                profit: profit,
                with_delivery: hasDelivery,
                discount_percentage: 0,
                final_price: totalAmount,
                customer_name: order.customer.name,
                notes: `Pedido iFood #${order.ifood_order_id.slice(-8)}`,
                sale_date: order.created_at_ifood,
              });

            if (salesError) throw salesError;
            syncedCount++;
          }

          // Mark order as synced
          const { error: updateError } = await supabase
            .from('ifood_orders')
            .update({ synced_to_sales: true })
            .eq('id', order.id);

          if (updateError) throw updateError;
        } catch (error) {
          console.error(`Error syncing order ${order.id}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Sincronização concluída!",
        description: `${syncedCount} itens sincronizados${errorCount > 0 ? `, ${errorCount} erros` : ''}`,
      });

      await loadOrders();
    } catch (error: any) {
      console.error('Error syncing to sales:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao sincronizar vendas",
        variant: "destructive",
      });
    } finally {
      setSyncingToSales(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pedidos iFood</h1>
          <p className="text-muted-foreground">
            Gerencie seus pedidos recebidos do iFood
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSyncToSales} disabled={syncingToSales || orders.length === 0}>
            {syncingToSales ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="mr-2 h-4 w-4" />
            )}
            Sincronizar com Vendas
          </Button>
          <Button onClick={handleSync} disabled={syncing} variant="outline">
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Buscar Pedidos
          </Button>
        </div>
      </div>

      <IfoodProductMapping
        open={mappingDialogOpen}
        onOpenChange={setMappingDialogOpen}
        unmappedProducts={unmappedProducts}
        onMappingComplete={() => syncOrdersToSales()}
      />

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Clique em "Sincronizar" para buscar novos pedidos do iFood
            </p>
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sincronizar Agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Pedido #{order.ifood_order_id.slice(-8)}
                    </CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(order.created_at_ifood), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.order_status)}>
                    {order.order_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{order.customer.name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                    </div>
                  </div>

                  {order.delivery_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Endereço de Entrega</p>
                        <p className="text-sm text-muted-foreground">
                          {order.delivery_address.streetName}, {order.delivery_address.streetNumber}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium">
                          R$ {(item.totalPrice || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R$ {order.sub_total.toFixed(2)}</span>
                  </div>
                  {order.delivery_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Entrega</span>
                      <span>R$ {order.delivery_fee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>R$ {order.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {!order.synced_to_sales && (
                  <Badge variant="outline" className="w-full justify-center">
                    Aguardando sincronização com vendas
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
