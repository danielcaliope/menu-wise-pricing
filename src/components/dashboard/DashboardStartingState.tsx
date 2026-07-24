import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, DollarSign, Package } from "lucide-react";
import { QuickActions } from "@/components/QuickActions";
import { useIngredients } from "@/features/ingredients/api";
import { useRecipes } from "@/features/recipes/api";
import { useRecipesOverview } from "@/hooks/useRecipesOverview";

type LatestPrice = { recipe_name: string; recipe_cost: number; suggested_price: number } | null;

async function fetchLatestPrice(): Promise<LatestPrice> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("pricing_history")
    .select("recipe_name, recipe_cost, suggested_price")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Estado 2 do Dashboard — configurado, mas ainda começando (menos de 2
// receitas próprias). Foco em avançar pro primeiro prato precificado.
export function DashboardStartingState() {
  const navigate = useNavigate();
  const { ingredients } = useIngredients();
  const { recipes } = useRecipes();
  const { overview } = useRecipesOverview();
  const { data: latestPrice } = useQuery({ queryKey: ["dashboard-latest-price"], queryFn: fetchLatestPrice });

  const averageCost = ingredients.length > 0
    ? ingredients.reduce((sum, i) => sum + Number(i.unit_cost), 0) / ingredients.length
    : 0;
  const incompleteRecipes = overview.filter((r) => r.ingredientCount === 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Vamos montar seu cardápio</h1>
        <p className="text-muted-foreground">Continue cadastrando receitas até ver seu primeiro preço recomendado</p>
      </div>

      <QuickActions hasIngredients={ingredients.length > 0} hasRecipes={recipes.length > 0} />

      {incompleteRecipes.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Receitas sem ingredientes</p>
              <p className="text-sm text-muted-foreground">
                {incompleteRecipes.map((r) => r.name).join(", ")} — sem ingredientes não dá pra calcular custo nem preço.
              </p>
              <Button variant="link" className="px-0 h-auto" onClick={() => navigate("/recipes")}>
                Adicionar ingredientes →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5" />
              Primeiro resultado de preço
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestPrice ? (
              <div className="space-y-1">
                <p className="font-medium">{latestPrice.recipe_name}</p>
                <p className="text-sm text-muted-foreground">Custo: R$ {Number(latestPrice.recipe_cost).toFixed(2)}</p>
                <p className="text-2xl font-bold text-primary">R$ {Number(latestPrice.suggested_price).toFixed(2)}</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">Nenhum preço calculado ainda</p>
                <Button size="sm" onClick={() => navigate("/pricing")}>Calcular Preço</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5" />
              Resumo de custos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Receitas cadastradas</span>
              <span className="font-medium">{recipes.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ingredientes cadastrados</span>
              <span className="font-medium">{ingredients.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Custo médio de ingrediente</span>
              <span className="font-medium">R$ {averageCost.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
