import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { calculateIngredientCost as calculateIngredientsCostDomain } from "@/domain/pricing";

type RecipeIngredient = {
  id: string;
  quantity: number;
  ingredients: {
    name: string;
    unit: string;
    unit_cost: number;
  };
};

type PortionCalculatorProps = {
  recipeId: string;
  recipeName: string;
  defaultServings: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PortionCalculator({
  recipeId,
  recipeName,
  defaultServings,
  open,
  onOpenChange,
}: PortionCalculatorProps) {
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [desiredServings, setDesiredServings] = useState(defaultServings);

  useEffect(() => {
    if (open) {
      fetchRecipeIngredients();
      setDesiredServings(defaultServings);
    }
  }, [open, recipeId]);

  const fetchRecipeIngredients = async () => {
    const { data, error } = await supabase
      .from("recipe_ingredients")
      .select(`
        id,
        quantity,
        ingredients (
          name,
          unit,
          unit_cost
        )
      `)
      .eq("recipe_id", recipeId);

    if (error) {
      toast({
        title: "Erro ao carregar ingredientes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setRecipeIngredients(data || []);
    }
  };

  const calculateAdjustedQuantity = (baseQuantity: number) => {
    return (baseQuantity * desiredServings) / defaultServings;
  };

  const calculateIngredientCost = (quantity: number, unitCost: number) => {
    return calculateAdjustedQuantity(quantity) * unitCost;
  };

  const calculateTotalCost = () => {
    // Nota: soma só o custo dos ingredientes já escalados por porção (sem perda%/
    // custos indiretos) — mesmo valor que esta calculadora sempre mostrou. Ver
    // divergência documentada no plano (Pricing.tsx usa a fórmula completa pro
    // mesmo prato); não alterada aqui, só extraída pro módulo de domínio.
    return calculateIngredientsCostDomain(
      recipeIngredients.map((item) => ({
        quantity: calculateAdjustedQuantity(item.quantity),
        unitCost: item.ingredients.unit_cost,
      })),
    );
  };

  const costPerServing = calculateTotalCost() / (desiredServings || 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Porções - {recipeName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Porções Padrão</Label>
              <Input
                type="number"
                value={defaultServings}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desired-servings">Porções Desejadas</Label>
              <Input
                id="desired-servings"
                type="number"
                min="1"
                value={desiredServings}
                onChange={(e) => setDesiredServings(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fator de multiplicação:</span>
                  <span className="font-medium">
                    {(desiredServings / defaultServings).toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo total:</span>
                  <span className="font-bold text-lg">
                    R$ {calculateTotalCost().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo por porção:</span>
                  <span className="font-medium">
                    R$ {costPerServing.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {recipeIngredients.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Ingredientes Ajustados</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Qtd. Base</TableHead>
                    <TableHead>Qtd. Ajustada</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipeIngredients.map((item) => {
                    const adjustedQty = calculateAdjustedQuantity(item.quantity);
                    const cost = calculateIngredientCost(item.quantity, item.ingredients.unit_cost);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.ingredients.name}
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.ingredients.unit}
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          {adjustedQty.toFixed(2)} {item.ingredients.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {cost.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
