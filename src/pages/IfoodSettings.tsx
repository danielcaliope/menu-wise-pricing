import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function IfoodSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ifood_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading config:', error);
        return;
      }

      if (data) {
        setConfig(data);
        setClientId(data.client_id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAuthenticate = async () => {
    if (!clientId || !clientSecret) {
      toast({
        title: "Erro",
        description: "Preencha Client ID e Client Secret",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const { data, error } = await supabase.functions.invoke('ifood-auth', {
        body: {
          action: 'authenticate',
          clientId,
          clientSecret,
        },
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Autenticado com iFood com sucesso",
      });

      await loadConfig();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao autenticar com iFood",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncOrders = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const { data, error } = await supabase.functions.invoke('ifood-sync-orders');

      if (error) throw error;

      toast({
        title: "Pedidos sincronizados!",
        description: `${data.newOrders} novos pedidos recebidos`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao sincronizar pedidos",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const isTokenExpired = config?.token_expires_at 
    ? new Date(config.token_expires_at) < new Date()
    : true;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integração iFood</h1>
        <p className="text-muted-foreground">
          Configure sua integração com iFood para receber pedidos automaticamente
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status da Integração</CardTitle>
              <CardDescription>
                Configure suas credenciais do iFood Developer Portal
              </CardDescription>
            </div>
            {config?.is_active && (
              <Badge variant={isTokenExpired ? "destructive" : "default"}>
                {isTokenExpired ? (
                  <>
                    <X className="w-3 h-3 mr-1" />
                    Token expirado
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Ativo
                  </>
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Seu Client ID do iFood"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input
              id="clientSecret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Seu Client Secret do iFood"
            />
          </div>

          <Button 
            onClick={handleAuthenticate} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {config?.is_active ? 'Atualizar Credenciais' : 'Conectar com iFood'}
          </Button>

          {config?.merchant_id && (
            <div className="pt-4 border-t">
              <Label className="text-sm text-muted-foreground">Merchant ID</Label>
              <p className="text-sm font-mono mt-1">{config.merchant_id}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {config?.is_active && (
        <Card>
          <CardHeader>
            <CardTitle>Sincronização de Pedidos</CardTitle>
            <CardDescription>
              Sincronize pedidos manualmente ou configure sincronização automática
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSyncOrders} 
              disabled={syncing || isTokenExpired}
              variant="outline"
              className="w-full"
            >
              {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sincronizar Pedidos Agora
            </Button>

            {isTokenExpired && (
              <p className="text-sm text-destructive mt-2">
                Token expirado. Por favor, atualize suas credenciais acima.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Como obter as credenciais?</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Acesse o <a href="https://developer.ifood.com.br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">iFood Developer Portal</a></li>
          <li>Crie ou acesse sua aplicação</li>
          <li>Copie o Client ID e Client Secret</li>
          <li>Cole as credenciais acima e clique em "Conectar com iFood"</li>
        </ol>
      </div>
    </div>
  );
}
