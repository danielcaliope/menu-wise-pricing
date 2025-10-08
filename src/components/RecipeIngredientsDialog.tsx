import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
};

type RecipeIngredient = {
  id: string;
  ingredient_id: string;
  quantity: number;
  ingredients: Ingredient;
};

interface RecipeIngredientsDialogProps {
  recipeId: string;
  ingredients: Ingredient[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function RecipeIngredientsDialog({
  recipeId,
  ingredients,
  open,
  onOpenChange,
  onUpdate,
}: RecipeIngredientsDialogProps) {
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (open && recipeId) {
      fetchRecipeIngredients();
    }
  }, [open, recipeId]);

  useEffect(() => {
    calculateTotalCost();
  }, [recipeIngredients]);

  const fetchRecipeIngredients = async () => {
    const { data, error } = await supabase
      .from("recipe_ingredients")
      .select(`
        id,
        ingredient_id,
        quantity,
        ingredients (id, name, unit, unit_cost)
      `)
      .eq("recipe_id", recipeId);

    if (error) {
      toast({
        title: "Erro ao carregar ingredientes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setRecipeIngredients(data as any || []);
    }
  };

  const calculateTotalCost = () => {
    const total = recipeIngredients.reduce((sum, ri) => {
      return sum + (ri.quantity * ri.ingredients.unit_cost);
    }, 0);
    setTotalCost(total);
  };

  const handleAddIngredient = async () => {
    if (!selectedIngredientId || !quantity) {
      toast({
        title: "Erro",
        description: "Selecione um ingrediente e informe a quantidade",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("recipe_ingredients")
      .insert([{
        recipe_id: recipeId,
        ingredient_id: selectedIngredientId,
        quantity: parseFloat(quantity),
      }]);

    if (error) {
      if (error.message.includes("duplicate")) {
        toast({
          title: "Erro",
          description: "Este ingrediente já foi adicionado",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao adicionar",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({ title: "Ingrediente adicionado!" });
      setSelectedIngredientId("");
      setQuantity("");
      fetchRecipeIngredients();
      onUpdate?.();
    }
  };

  const handleRemoveIngredient = async (id: string) => {
    const { error } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Ingrediente removido!" });
      fetchRecipeIngredients();
      onUpdate?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Ingredientes da Receita</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Ingrediente</Label>
              <Select
                value={selectedIngredientId}
                onValueChange={setSelectedIngredientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ingrediente" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ingredient) => (
                    <SelectItem key={ingredient.id} value={ingredient.id}>
                      {ingredient.name} ({ingredient.unit}) - R$ {ingredient.unit_cost.toFixed(2)}/{ingredient.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32 space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddIngredient} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Ingredientes Adicionados</h3>
            {recipeIngredients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum ingrediente adicionado ainda
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Custo Unit.</TableHead>
                      <TableHead>Custo Total</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipeIngredients.map((ri) => (
                      <TableRow key={ri.id}>
                        <TableCell className="font-medium">
                          {ri.ingredients.name}
                        </TableCell>
                        <TableCell>
                          {ri.quantity} {ri.ingredients.unit}
                        </TableCell>
                        <TableCell>
                          R$ {ri.ingredients.unit_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          R$ {(ri.quantity * ri.ingredients.unit_cost).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveIngredient(ri.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Custo Total da Receita:</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}