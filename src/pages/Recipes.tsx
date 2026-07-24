import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ChefHat, Calculator, Tag, BookOpen, Clock, Percent, Users } from "lucide-react";
import { PortionCalculator } from "@/components/PortionCalculator";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PrerequisiteNotice } from "@/components/PrerequisiteNotice";
import { CategoryIcon } from "@/components/recipes/CategoryIcon";
import { RecipeEditorDialog } from "@/components/recipes/RecipeEditorDialog";
import { useRecipes, useDeleteRecipe } from "@/features/recipes/api";
import { useIngredients } from "@/features/ingredients/api";
import type { Recipe } from "@/schemas/recipe";

// Faixas puramente visuais pra destacar desperdício alto rapidamente na lista —
// não é um limite configurável em nenhum lugar do app, só banda de cor.
function wastePercentageClassName(percentage: number): string {
  if (percentage > 10) return "text-destructive";
  if (percentage > 5) return "text-warning";
  return "text-success";
}

export default function Recipes() {
  const navigate = useNavigate();
  const { recipes, isLoading: loadingRecipes } = useRecipes();
  const deleteRecipe = useDeleteRecipe();
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

  const recipeCountByCategory = new Map<string, number>();
  recipes.forEach((recipe) => {
    if (!recipe.category_id) return;
    recipeCountByCategory.set(recipe.category_id, (recipeCountByCategory.get(recipe.category_id) ?? 0) + 1);
  });

  const averageWastePercentage = recipes.length > 0
    ? recipes.reduce((sum, r) => sum + r.waste_percentage, 0) / recipes.length
    : 0;
  const averagePrepTime = recipes.length > 0
    ? Math.round(recipes.reduce((sum, r) => sum + r.prep_time_minutes, 0) / recipes.length)
    : 0;
  const totalPortions = recipes.reduce((sum, r) => sum + r.default_servings, 0);

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

        {recipes.length > 0 && (
          <Card>
            <CardContent className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold leading-none">{recipes.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Receitas cadastradas</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold leading-none">{averagePrepTime} min</p>
                  <p className="mt-1 text-xs text-muted-foreground">Tempo médio de preparo</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <p className={cn("text-2xl font-semibold leading-none", wastePercentageClassName(averageWastePercentage))}>
                    {averageWastePercentage.toFixed(1)}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Desperdício médio</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold leading-none">{totalPortions}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Porções somadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <RecipeEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          editingRecipe={editingRecipe}
          ingredients={ingredients}
          categories={categories}
        />

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Lista de Receitas / Pratos</CardTitle>
              <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Buscar receita..."
                  className="w-full sm:w-72"
                />
                <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/categories")}>
                  <Tag className="h-4 w-4" />
                  Gerenciar Categorias
                </Button>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    selectedCategory === "all"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  Todas
                  <span className={cn(
                    "rounded-full px-1.5 text-[10px]",
                    selectedCategory === "all" ? "bg-primary-foreground/20" : "bg-muted",
                  )}>
                    {recipes.length}
                  </span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      selectedCategory === cat.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <CategoryIcon iconName={cat.icon} className="h-3.5 w-3.5" />
                    {cat.name}
                    <span className={cn(
                      "rounded-full px-1.5 text-[10px]",
                      selectedCategory === cat.id ? "bg-primary-foreground/20" : "bg-muted",
                    )}>
                      {recipeCountByCategory.get(cat.id) ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
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
              <div className="space-y-2">
                <div className="hidden grid-cols-[2fr_1.3fr_0.7fr_0.9fr_0.9fr_auto] gap-4 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                  <span>Nome</span>
                  <span>Categoria</span>
                  <span>Porções</span>
                  <span>% Desperdício</span>
                  <span>Preparo</span>
                  <span className="text-right">Ações</span>
                </div>
                {filteredRecipes.map((recipe) => {
                  const category = categories.find((c) => c.id === recipe.category_id);
                  return (
                    <div
                      key={recipe.id}
                      className="grid grid-cols-2 items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40 sm:grid-cols-[2fr_1.3fr_0.7fr_0.9fr_0.9fr_auto] sm:gap-4"
                    >
                      <span className="col-span-2 font-medium sm:col-span-1">{recipe.name}</span>
                      <div>
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
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground sm:block">
                        <Users className="h-3.5 w-3.5 sm:hidden" />
                        {recipe.default_servings}
                      </div>
                      <div className={cn("text-sm font-medium sm:text-base", wastePercentageClassName(recipe.waste_percentage))}>
                        {recipe.waste_percentage}%
                      </div>
                      <div className="text-sm text-muted-foreground">{recipe.prep_time_minutes} min</div>
                      <div className="col-span-2 flex justify-end gap-2 sm:col-span-1">
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
                    </div>
                  );
                })}
              </div>
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
