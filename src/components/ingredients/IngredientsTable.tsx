import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Package } from "lucide-react";
import type { Ingredient } from "@/schemas/ingredient";

// unit_cost pode ser um valor sub-centavo (ex.: custo por grama) — toFixed(2)
// mostraria "R$ 0.00" ou "R$ 0.01" indistintamente, escondendo justamente o
// número que esta tela existe para mostrar corretamente.
function formatUnitCost(value: number): string {
  return value > 0 && value < 0.01 ? value.toFixed(4) : value.toFixed(2);
}

type IngredientsTableProps = {
  ingredients: Ingredient[];
  hasAnyIngredient: boolean;
  searchQuery: string;
  onClearSearch: () => void;
  onCreateFirst: () => void;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (id: string) => void;
};

export function IngredientsTable({
  ingredients,
  hasAnyIngredient,
  searchQuery,
  onClearSearch,
  onCreateFirst,
  onEdit,
  onDelete,
}: IngredientsTableProps) {
  if (!hasAnyIngredient) {
    return (
      <EmptyState
        icon={Package}
        title="Nenhum ingrediente cadastrado"
        description="Comece cadastrando os ingredientes que você usa nas suas receitas para calcular custos e preços."
        actionLabel="Cadastrar Primeiro Ingrediente"
        onAction={onCreateFirst}
      />
    );
  }

  if (ingredients.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Nenhum resultado encontrado"
        description={`Não encontramos ingredientes com "${searchQuery}"`}
        actionLabel="Limpar Busca"
        onAction={onClearSearch}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Unidade</TableHead>
          <TableHead>Custo Unitário</TableHead>
          <TableHead>Fornecedor</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ingredients.map((ingredient) => (
          <TableRow key={ingredient.id}>
            <TableCell className="font-medium">{ingredient.name}</TableCell>
            <TableCell>{ingredient.unit}</TableCell>
            <TableCell>R$ {formatUnitCost(ingredient.unit_cost)}</TableCell>
            <TableCell>{ingredient.supplier || "-"}</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="icon" onClick={() => onEdit(ingredient)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(ingredient.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
