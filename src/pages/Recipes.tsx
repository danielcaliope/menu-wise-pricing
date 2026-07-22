import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ChefHat, Calculator } from "lucide-react";
import { PortionCalculator } from "@/components/PortionCalculator";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PrerequisiteNotice } from "@/components/PrerequisiteNotice";
import { CategoryIcon } from "@/components/recipes/CategoryIcon";
import { RecipeEditorDialog } from "@/components/recipes/RecipeEditorDialog";
import { useRecipes } from "@/hooks/useRecipes";
import { useIngredients } from "@/hooks/useIngredients";
import type { Recipe } from "@/schemas/recipe";

export default function Recipes() {
  const navigate = useNavigate();
  const { recipes, isLoading: loadingRecipes, deleteRecipe } = useRecipes();
  const { ingredients } = useIngredients();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [portionCalculatorOpen, setPortionCalculatorOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const handleCreate = () => {
    setEditingRecipe(null);
    setEditorOpen(true);
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta receita?")) return;

    try {
      await deleteRecipe.mutateAsync(id);
      toast({ title: "Receita excluída com sucesso!" });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  };

  const handlePortionCalculator = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setPortionCalculatorOpen(true);
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || recipe.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loadingRecipes) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <Breadcrumbs items={[{ label: "Receitas / Pratos" }]} />
          <div>
            <h1 className="text-3xl font-bold mb-2">Receitas / Pratos</h1>
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
        <Breadcrumbs items={[{ label: "Receitas / Pratos" }]} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Receitas / Pratos</h1>
            <p className="text-muted-foreground">Monte suas receitas e veja o custo e o preço em tempo real</p>
          </div>
          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
        </div>

        {ingredients.length === 0 && (
          <PrerequisiteNotice
            title="Cadastre ingredientes primeiro"
            description="Você precisa ter ingredientes cadastrados para montar suas receitas."
            actionLabel="Ir para Ingredientes"
            actionRoute="/ingredients"
          />
        )}

        <RecipeEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          editingRecipe={editingRecipe}
          ingredients={ingredients}
          categories={categories}
        />

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Lista de Receitas / Pratos</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <CategoryIcon iconName={cat.icon} className="h-4 w-4" />
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Buscar receita..."
                  className="w-full sm:w-72"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <EmptyState
                icon={ChefHat}
                title="Nenhuma receita criada"
                description="Crie sua primeira receita combinando ingredientes e definindo quantidades."
                actionLabel="Criar Primeira Receita"
                onAction={handleCreate}
              />
            ) : filteredRecipes.length === 0 ? (
              <EmptyState
                icon={ChefHat}
                title="Nenhum resultado encontrado"
                description={`Não encontramos receitas com "${searchQuery}"`}
                actionLabel="Limpar Busca"
                onAction={() => setSearchQuery("")}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Porções</TableHead>
                    <TableHead>% Desperdício</TableHead>
                    <TableHead>Tempo Preparo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipes.map((recipe) => {
                    const category = categories.find((c) => c.id === recipe.category_id);
                    return (
                      <TableRow key={recipe.id}>
                        <TableCell className="font-medium">{recipe.name}</TableCell>
                        <TableCell>
                          {category ? (
                            <Badge
                              variant="secondary"
                              className="gap-1.5"
                              style={{ backgroundColor: category.color || "#3b82f6", color: "white" }}
                            >
                              <CategoryIcon iconName={category.icon} className="h-4 w-4" />
                              {category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sem categoria</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{recipe.default_servings}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{recipe.waste_percentage}%</Badge>
                        </TableCell>
                        <TableCell>{recipe.prep_time_minutes} min</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handlePortionCalculator(recipe)}>
                              <Calculator className="h-4 w-4 mr-1" />
                              Porções
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleEdit(recipe)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(recipe.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {selectedRecipe && (
          <PortionCalculator
            recipeId={selectedRecipe.id}
            recipeName={selectedRecipe.name}
            defaultServings={selectedRecipe.default_servings}
            open={portionCalculatorOpen}
            onOpenChange={setPortionCalculatorOpen}
          />
        )}
      </div>
    </Layout>
  );
}
