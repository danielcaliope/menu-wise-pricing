import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { useRecipeIngredients } from "@/hooks/useRecipeIngredients";
import { calculateIngredientLineCost } from "@/domain/pricing";

type Ingredient = { id: string; name: string; unit: string; unit_cost: number };

type RecipeIngredientsEditorProps = {
  recipeId: string;
  ingredients: Ingredient[];
};

export function RecipeIngredientsEditor({ recipeId, ingredients }: RecipeIngredientsEditorProps) {
  const { recipeIngredients, addIngredient, removeIngredient } = useRecipeIngredients(recipeId);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleAdd = async () => {
    if (!selectedIngredientId || !quantity) {
      toast({
        title: "Erro",
        description: "Selecione um ingrediente e informe a quantidade",
        variant: "destructive",
      });
      return;
    }

    try {
      await addIngredient.mutateAsync({ recipeId, ingredientId: selectedIngredientId, quantity: parseFloat(quantity) });
      toast({ title: "Ingrediente adicionado!" });
      setSelectedIngredientId("");
      setQuantity("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Erro ao adicionar",
        description: message.includes("duplicate") ? "Este ingrediente já foi adicionado" : message,
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeIngredient.mutateAsync({ id, recipeId });
      toast({ title: "Ingrediente removido!" });
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Ingredientes</h3>
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label>Ingrediente</Label>
          <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
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
          <Button type="button" onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {recipeIngredients.length === 0 ? (
        <p className="text-center text-muted-foreground py-6 text-sm">Nenhum ingrediente adicionado ainda</p>
      ) : (
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
                <TableCell className="font-medium">{ri.ingredients.name}</TableCell>
                <TableCell>{ri.quantity} {ri.ingredients.unit}</TableCell>
                <TableCell>R$ {ri.ingredients.unit_cost.toFixed(2)}</TableCell>
                <TableCell className="font-semibold">
                  R$ {calculateIngredientLineCost({ quantity: ri.quantity, unitCost: ri.ingredients.unit_cost }).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(ri.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
