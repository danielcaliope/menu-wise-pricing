import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { useRecipeIndirectCosts, useAddRecipeIndirectCost, useDeleteRecipeIndirectCost, type RecipeIndirectCostType } from "@/features/recipes/api";

const COST_TYPE_LABEL: Record<RecipeIndirectCostType, string> = {
  packaging: "Embalagem",
  labor: "Mão de Obra",
  other: "Outro",
};

type RecipeIndirectCostsEditorProps = {
  recipeId: string;
};

export function RecipeIndirectCostsEditor({ recipeId }: RecipeIndirectCostsEditorProps) {
  const { recipeIndirectCosts } = useRecipeIndirectCosts(recipeId);
  const addCost = useAddRecipeIndirectCost();
  const deleteCost = useDeleteRecipeIndirectCost();
  const [costName, setCostName] = useState("");
  const [amount, setAmount] = useState("");
  const [costType, setCostType] = useState<RecipeIndirectCostType>("packaging");

  const handleAdd = async () => {
    if (!costName || !amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e valor do custo",
        variant: "destructive",
      });
      return;
    }

    try {
      await addCost.mutateAsync({ recipe_id: recipeId, cost_name: costName, amount: parseFloat(amount), cost_type: costType });
      toast({ title: "Custo adicionado à receita!" });
      setCostName("");
      setAmount("");
    } catch (error) {
      toast({
        title: "Erro ao adicionar custo",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCost.mutateAsync(id);
      toast({ title: "Custo removido!" });
    } catch (error) {
      toast({
        title: "Erro ao remover custo",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Embalagem e outros custos desta receita</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Nome do custo</Label>
          <Input value={costName} onChange={(e) => setCostName(e.target.value)} placeholder="Ex: Embalagem plástica" />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={costType} onValueChange={(value) => setCostType(value as RecipeIndirectCostType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="packaging">Embalagem</SelectItem>
              <SelectItem value="labor">Mão de Obra</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <Button type="button" onClick={handleAdd} className="gap-2">
        <Plus className="h-4 w-4" />
        Adicionar
      </Button>

      {recipeIndirectCosts.length === 0 ? (
        <p className="text-center text-muted-foreground py-4 text-sm">Nenhum custo de embalagem/mão de obra cadastrado ainda</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipeIndirectCosts.map((cost) => (
              <TableRow key={cost.id}>
                <TableCell className="font-medium">{cost.cost_name}</TableCell>
                <TableCell>{COST_TYPE_LABEL[cost.cost_type]}</TableCell>
                <TableCell>R$ {Number(cost.amount).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleDelete(cost.id)}>
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
