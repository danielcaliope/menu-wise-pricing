import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Calculator, TrendingUp, MapPin, DollarSign, History, Save, Info, Trash2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StatsSkeleton } from "@/components/SkeletonLoader";

type Recipe = {
  id: string;
  name: string;
  waste_percentage: number;
};

type PricingConfig = {
  profit_margin_percentage: number;
  tax_percentage: number;
  regional_factor: number;
  income_level: string;
  delivery_fee_percentage: number;
};

type PricingHistoryItem = {
  id: string;
  recipe_id: string;
  recipe_name: string;
  recipe_cost: number;
  profit_margin_percentage: number;
  tax_percentage: number;
  regional_factor: number;
  suggested_price: number;
  delivery_fee_percentage: number;
  price_without_delivery: number;
  price_with_delivery: number;
  created_at: string;
};

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [recipeCost, setRecipeCost] = useState(0);
  const [config, setConfig] = useState<PricingConfig>({
    profit_margin_percentage: 30,
    tax_percentage: 15,
    regional_factor: 1.0,
    income_level: "medium",
    delivery_fee_percentage: 0,
  });
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [pricingHistory, setPricingHistory] = useState<PricingHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    if (selectedRecipeId) {
      calculateRecipeCost(selectedRecipeId);
    }
  }, [selectedRecipeId]);

  useEffect(() => {
    calculateSuggestedPrice();
  }, [recipeCost, config]);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    await Promise.all([
      fetchRecipes(),
      fetchPricingConfig(session.user.id),
      fetchProfile(session.user.id),
      fetchPricingHistory(session.user.id),
    ]);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(data);
  };

  const fetchPricingHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from("pricing_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setPricingHistory(data);
    }
  };

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("id, name, waste_percentage")
      .order("name");

    if (error) {
      toast({
        title: "Erro ao carregar receitas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setRecipes(data || []);
      
      // Check if there's a recipe ID in URL params
      const recipeParam = searchParams.get("recipe");
      if (recipeParam && data?.some(r => r.id === recipeParam)) {
        setSelectedRecipeId(recipeParam);
      }
    }
    setLoading(false);
  };

  const fetchPricingConfig = async (userId: string) => {
    const { data, error } = await supabase
      .from("pricing_configs")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setConfig({
        profit_margin_percentage: Number(data.profit_margin_percentage),
        tax_percentage: Number(data.tax_percentage),
        regional_factor: Number(data.regional_factor),
        income_level: data.income_level || "medium",
        delivery_fee_percentage: Number(data.delivery_fee_percentage || 0),
      });
    } else if (!error) {
      // Create default config
      await supabase.from("pricing_configs").insert([{ user_id: userId }]);
    }
  };

  const calculateRecipeCost = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const { data, error } = await supabase
      .from("recipe_ingredients")
      .select(`
        quantity,
        ingredients (unit_cost)
      `)
      .eq("recipe_id", recipeId);

    if (error) {
      toast({
        title: "Erro ao calcular custo",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const baseCost = (data as any || []).reduce((sum: number, ri: any) => {
      return sum + (ri.quantity * ri.ingredients.unit_cost);
    }, 0);

    // Apply waste percentage
    const costWithWaste = baseCost * (1 + recipe.waste_percentage / 100);
    setRecipeCost(costWithWaste);
  };

  const calculateSuggestedPrice = () => {
    if (recipeCost === 0) {
      setSuggestedPrice(0);
      return;
    }

    // Check if user has paid plan for regional factor
    const effectiveFactor = profile?.plan === "paid" ? config.regional_factor : 1.0;

    // Formula: (Custo + Lucro + Impostos) * Fator Regional
    const costWithProfit = recipeCost * (1 + config.profit_margin_percentage / 100);
    const costWithTax = costWithProfit * (1 + config.tax_percentage / 100);
    const finalPrice = costWithTax * effectiveFactor;

    setSuggestedPrice(finalPrice);
  };

  const handleSaveConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("pricing_configs")
      .upsert({
        user_id: user.id,
        profit_margin_percentage: config.profit_margin_percentage,
        tax_percentage: config.tax_percentage,
        regional_factor: config.regional_factor,
        income_level: config.income_level,
        delivery_fee_percentage: config.delivery_fee_percentage,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Configurações salvas com sucesso!" });
      calculateSuggestedPrice();
    }
  };

  const handleIncomeChange = (income: string) => {
    const factors = {
      low: 0.90,
      medium: 1.10,
      high: 1.25,
    };
    setConfig({
      ...config,
      income_level: income,
      regional_factor: factors[income as keyof typeof factors],
    });
  };

  const handleSavePricingToHistory = async () => {
    if (!selectedRecipeId || recipeCost === 0) {
      toast({
        title: "Erro",
        description: "Selecione uma receita primeiro",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);
    if (!selectedRecipe) return;

    const priceWithDelivery = suggestedPrice * (1 + config.delivery_fee_percentage / 100);

    const { error } = await supabase
      .from("pricing_history")
      .insert([{
        user_id: user.id,
        recipe_id: selectedRecipeId,
        recipe_name: selectedRecipe.name,
        recipe_cost: recipeCost,
        profit_margin_percentage: config.profit_margin_percentage,
        tax_percentage: config.tax_percentage,
        regional_factor: config.regional_factor,
        suggested_price: suggestedPrice,
        delivery_fee_percentage: config.delivery_fee_percentage,
        price_without_delivery: suggestedPrice,
        price_with_delivery: priceWithDelivery,
      }]);

    if (error) {
      toast({
        title: "Erro ao salvar histórico",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Precificação salva no histórico!" });
      fetchPricingHistory(user.id);
    }
  };

  const handleDeletePricingHistory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item do histórico?")) return;

    const { error } = await supabase
      .from("pricing_history")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Item excluído com sucesso!" });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) fetchPricingHistory(user.id);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <Breadcrumbs items={[{ label: "Precificação" }]} />
          <div>
            <h1 className="text-3xl font-bold mb-2">Precificação Inteligente</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
          <StatsSkeleton />
        </div>
      </Layout>
    );
  }

  const profitAmount = recipeCost * (config.profit_margin_percentage / 100);
  const taxAmount = (recipeCost + profitAmount) * (config.tax_percentage / 100);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <Breadcrumbs items={[{ label: "Precificação" }]} />
        
        <div>
          <h1 className="text-3xl font-bold mb-2">Precificação Inteligente</h1>
          <p className="text-muted-foreground">
            Calcule o preço ideal para seus pratos com base em custos, impostos e região
          </p>
        </div>

        {recipes.length === 0 && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Você precisa criar fichas técnicas antes de fazer a precificação.
                 <Button
                  variant="link"
                  onClick={() => navigate("/recipes")}
                  className="ml-2"
                >
                  Ir para Receitas / Pratos
                </Button>
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Selecionar Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Escolha a receita / prato</Label>
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma receita" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRecipeId && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Custo Real da Receita:</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {recipeCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Configurações de Precificação
            </CardTitle>
            <CardDescription>
              Ajuste margem de lucro, impostos e fator regional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Margem de Lucro (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1000"
                  value={config.profit_margin_percentage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 1000) {
                      setConfig({ ...config, profit_margin_percentage: value });
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Impostos (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={config.tax_percentage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 100) {
                      setConfig({ ...config, tax_percentage: value });
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa Serviço Delivery (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={config.delivery_fee_percentage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 100) {
                      setConfig({ ...config, delivery_fee_percentage: value });
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-accent/20 rounded-lg border border-accent/30">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-5 w-5 text-accent mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-semibold">Fator Regional</h4>
                    <Badge variant="outline" className="gap-1">
                      <Info className="h-3 w-3" />
                      Ajuste por localização
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    O fator regional ajusta o preço com base no poder aquisitivo da região onde seu estabelecimento está localizado.
                  </p>
                  {profile?.plan === "free" ? (
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        Plano Gratuito - Fator Regional Desabilitado
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Upgrade para o plano pago para ativar ajuste por região e poder aquisitivo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label>Nível de Renda da Região</Label>
                        <Select value={config.income_level} onValueChange={handleIncomeChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2">
                                Baixa Renda
                                <Badge variant="secondary">0.90x</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2">
                                Média Renda
                                <Badge variant="secondary">1.10x</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2">
                                Alta Renda
                                <Badge variant="secondary">1.25x</Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            <Info className="h-3 w-3 mr-1" />
                            Baixa: reduz preço em 10%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Info className="h-3 w-3 mr-1" />
                            Média: aumenta 10%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Info className="h-3 w-3 mr-1" />
                            Alta: aumenta 25%
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Fator Regional (ajuste manual)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.1"
                          max="10"
                          value={config.regional_factor}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0.1 && value <= 10) {
                              setConfig({ ...config, regional_factor: value });
                            }
                          }}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button onClick={handleSaveConfig} className="w-full">
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        {selectedRecipeId && recipeCost > 0 && (
          <Card className="border-primary shadow-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <DollarSign className="h-6 w-6" />
                Preço Sugerido
              </CardTitle>
              <CardDescription>
                Cálculo baseado nas suas configurações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="text-center p-6 bg-muted rounded-lg border-2">
                    <p className="text-sm text-muted-foreground mb-2">Preço Sem Delivery</p>
                    <p className="text-3xl font-bold text-foreground">
                      R$ {suggestedPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-6 bg-gradient-primary rounded-lg text-primary-foreground border-2 border-primary">
                    <p className="text-sm opacity-90 mb-2">Preço Com Delivery</p>
                    <p className="text-3xl font-bold">
                      R$ {(suggestedPrice * (1 + config.delivery_fee_percentage / 100)).toFixed(2)}
                    </p>
                    {config.delivery_fee_percentage > 0 && (
                      <p className="text-xs opacity-75 mt-1">
                        +{config.delivery_fee_percentage}% taxa delivery
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-3">Detalhamento do Cálculo:</h4>
                  <div className="flex justify-between text-sm">
                    <span>Custo Base:</span>
                    <span className="font-medium">R$ {recipeCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>+ Lucro ({config.profit_margin_percentage}%):</span>
                    <span className="font-medium text-success">+ R$ {profitAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>+ Impostos ({config.tax_percentage}%):</span>
                    <span className="font-medium text-warning">+ R$ {taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>× Fator Regional ({config.regional_factor}):</span>
                    <span className="font-medium text-accent">
                      {profile?.plan === "free" ? "(desabilitado)" : `×${config.regional_factor}`}
                    </span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Preço Sem Delivery:</span>
                      <span className="text-foreground text-lg">R$ {suggestedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  {config.delivery_fee_percentage > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>+ Taxa Delivery ({config.delivery_fee_percentage}%):</span>
                        <span className="font-medium text-primary">
                          + R$ {(suggestedPrice * (config.delivery_fee_percentage / 100)).toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between font-semibold">
                          <span>Preço Com Delivery:</span>
                          <span className="text-primary text-lg">
                            R$ {(suggestedPrice * (1 + config.delivery_fee_percentage / 100)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                 <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <p className="text-sm text-center">
                    <span className="font-semibold">Lucro por venda (sem delivery):</span>{" "}
                    <span className="text-success font-bold">
                      R$ {(suggestedPrice - recipeCost - taxAmount).toFixed(2)}
                    </span>
                    {" "}({((profitAmount / recipeCost) * 100).toFixed(1)}%)
                  </p>
                </div>

                <Button onClick={handleSavePricingToHistory} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  Salvar no Histórico
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Precificações
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </CardHeader>
          {showHistory && (
            <CardContent>
              {pricingHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma precificação salva ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {pricingHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{item.recipe_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-right">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Sem delivery: <span className="font-semibold text-foreground">R$ {Number(item.price_without_delivery || item.suggested_price).toFixed(2)}</span>
                              </p>
                              {item.delivery_fee_percentage > 0 && (
                                <p className="text-lg font-bold text-primary">
                                  Com delivery: R$ {Number(item.price_with_delivery || item.suggested_price).toFixed(2)}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Custo: R$ {Number(item.recipe_cost).toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeletePricingHistory(item.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          Lucro: {Number(item.profit_margin_percentage)}%
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Imposto: {Number(item.tax_percentage)}%
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Fator: {Number(item.regional_factor)}x
                        </Badge>
                        {item.delivery_fee_percentage > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Delivery: {Number(item.delivery_fee_percentage)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </Layout>
  );
}