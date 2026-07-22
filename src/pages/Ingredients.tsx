import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Upload } from "lucide-react";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useIngredients } from "@/hooks/useIngredients";
import { IngredientFormDialog } from "@/components/ingredients/IngredientFormDialog";
import { IngredientImportDialog } from "@/components/ingredients/IngredientImportDialog";
import { IngredientsFilters } from "@/components/ingredients/IngredientsFilters";
import { IngredientsTable } from "@/components/ingredients/IngredientsTable";
import type { Ingredient } from "@/schemas/ingredient";

export default function Ingredients() {
  const navigate = useNavigate();
  const { ingredients, isLoading, deleteIngredient, importIngredients } = useIngredients();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ingredient.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingIngredient(null);
    setDialogOpen(true);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ingrediente?")) return;

    try {
      await deleteIngredient.mutateAsync(id);
      toast({ title: "Ingrediente excluído com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <Breadcrumbs items={[{ label: "Ingredientes" }]} />
          <div>
            <h1 className="text-3xl font-bold mb-2">Ingredientes</h1>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
          <TableSkeleton rows={5} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Ingredientes" }]} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ingredientes</h1>
            <p className="text-muted-foreground">Gerencie seus ingredientes e custos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Importar CSV
            </Button>
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Novo Ingrediente
            </Button>
          </div>
        </div>

        <IngredientFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingIngredient={editingIngredient}
        />

        <IngredientImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={(rows) => importIngredients.mutateAsync(rows)}
        />

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Lista de Ingredientes</CardTitle>
              <IngredientsFilters value={searchQuery} onChange={setSearchQuery} />
            </div>
          </CardHeader>
          <CardContent>
            <IngredientsTable
              ingredients={filteredIngredients}
              hasAnyIngredient={ingredients.length > 0}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery("")}
              onCreateFirst={handleCreate}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
