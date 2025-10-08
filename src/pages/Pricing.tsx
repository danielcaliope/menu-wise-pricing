import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Calculator, TrendingUp, MapPin, DollarSign } from "lucide-react";

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
};

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [recipeCost, setRecipeCost] = useState(0);
  const [config, setConfig] = useState<PricingConfig>({
    profit_margin_percentage: 30,
    tax_percentage: 15,
    regional_factor: 1.0,
    income_level: "medium",
  });
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [profile, setProfile] = useState<any>(null);

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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const profitAmount = recipeCost * (config.profit_margin_percentage / 100);
  const taxAmount = (recipeCost + profitAmount) * (config.tax_percentage / 100);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
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
                  Ir para Fichas Técnicas
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
                <Label>Escolha a ficha técnica</Label>
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
                  value={config.profit_margin_percentage}
                  onChange={(e) => setConfig({ ...config, profit_margin_percentage: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Impostos (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={config.tax_percentage}
                  onChange={(e) => setConfig({ ...config, tax_percentage: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="p-4 bg-accent/20 rounded-lg border border-accent/30">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-5 w-5 text-accent mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Fator Regional</h4>
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
                      <div className="space-y-2">
                        <Label>Nível de Renda da Região</Label>
                        <Select value={config.income_level} onValueChange={handleIncomeChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              Baixa Renda (Fator 0.90)
                            </SelectItem>
                            <SelectItem value="medium">
                              Média Renda (Fator 1.10)
                            </SelectItem>
                            <SelectItem value="high">
                              Alta Renda (Fator 1.25)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fator Regional (ajuste manual)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={config.regional_factor}
                          onChange={(e) => setConfig({ ...config, regional_factor: parseFloat(e.target.value) })}
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
                <div className="text-center p-6 bg-gradient-primary rounded-lg text-white">
                  <p className="text-sm opacity-90 mb-2">Preço de Venda Sugerido</p>
                  <p className="text-5xl font-bold">
                    R$ {suggestedPrice.toFixed(2)}
                  </p>
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
                      <span>Preço Final:</span>
                      <span className="text-primary text-lg">R$ {suggestedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                  <p className="text-sm text-center">
                    <span className="font-semibold">Lucro por venda:</span>{" "}
                    <span className="text-success font-bold">
                      R$ {(suggestedPrice - recipeCost - taxAmount).toFixed(2)}
                    </span>
                    {" "}({((profitAmount / recipeCost) * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}