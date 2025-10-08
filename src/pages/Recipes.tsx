import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ChefHat } from "lucide-react";
import { z } from "zod";
import { RecipeIngredientsDialog } from "@/components/RecipeIngredientsDialog";

const recipeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  waste_percentage: z.number().min(0).max(100),
  prep_time_minutes: z.number().min(0),
  notes: z.string().optional(),
});

type Recipe = {
  id: string;
  name: string;
  waste_percentage: number;
  prep_time_minutes: number;
  notes: string | null;
};

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
};

export default function Recipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ingredientsDialogOpen, setIngredientsDialogOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    waste_percentage: "0",
    prep_time_minutes: "0",
    notes: "",
  });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await Promise.all([fetchRecipes(), fetchIngredients()]);
  };

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
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

  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Erro ao carregar ingredientes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIngredients(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = recipeSchema.parse({
        name: formData.name,
        waste_percentage: parseFloat(formData.waste_percentage),
        prep_time_minutes: parseInt(formData.prep_time_minutes),
        notes: formData.notes || null,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingId) {
        const { error } = await supabase
          .from("recipes")
          .update({
            name: validated.name,
            waste_percentage: validated.waste_percentage,
            prep_time_minutes: validated.prep_time_minutes,
            notes: validated.notes || null,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Receita atualizada com sucesso!" });
      } else {
        const { data, error } = await supabase
          .from("recipes")
          .insert([{
            name: validated.name,
            waste_percentage: validated.waste_percentage,
            prep_time_minutes: validated.prep_time_minutes,
            notes: validated.notes || null,
            user_id: user.id,
          }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setSelectedRecipeId(data.id);
          setIngredientsDialogOpen(true);
        }
        toast({ title: "Receita criada! Agora adicione os ingredientes." });
      }

      setDialogOpen(false);
      resetForm();
      fetchRecipes();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: String(error),
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingId(recipe.id);
    setFormData({
      name: recipe.name,
      waste_percentage: recipe.waste_percentage.toString(),
      prep_time_minutes: recipe.prep_time_minutes.toString(),
      notes: recipe.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta receita?")) return;

    const { error } = await supabase.from("recipes").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Receita excluída com sucesso!" });
      fetchRecipes();
    }
  };

  const handleManageIngredients = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setIngredientsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", waste_percentage: "0", prep_time_minutes: "0", notes: "" });
    setEditingId(null);
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

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Receitas / Pratos</h1>
            <p className="text-muted-foreground">
              Crie e gerencie suas receitas com ingredientes
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Receita
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Receita" : "Nova Receita"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Prato/Bebida</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Pizza Margherita"
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="waste">% Desperdício</Label>
                    <Input
                      id="waste"
                      type="number"
                      step="0.01"
                      value={formData.waste_percentage}
                      onChange={(e) => setFormData({ ...formData, waste_percentage: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prep">Tempo de Preparo (min)</Label>
                    <Input
                      id="prep"
                      type="number"
                      value={formData.prep_time_minutes}
                      onChange={(e) => setFormData({ ...formData, prep_time_minutes: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Instruções especiais ou observações..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Atualizar" : "Criar e Adicionar Ingredientes"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {ingredients.length === 0 && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Você precisa cadastrar ingredientes antes de criar receitas.
                <Button
                  variant="link"
                  onClick={() => navigate("/ingredients")}
                  className="ml-2"
                >
                  Ir para Ingredientes
                </Button>
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Receitas / Pratos</CardTitle>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma receita criada ainda
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>% Desperdício</TableHead>
                    <TableHead>Tempo Preparo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((recipe) => (
                    <TableRow key={recipe.id}>
                      <TableCell className="font-medium">{recipe.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {recipe.waste_percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>{recipe.prep_time_minutes} min</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageIngredients(recipe.id)}
                          >
                            Ingredientes
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(recipe)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(recipe.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {selectedRecipeId && (
          <RecipeIngredientsDialog
            recipeId={selectedRecipeId}
            ingredients={ingredients}
            open={ingredientsDialogOpen}
            onOpenChange={setIngredientsDialogOpen}
            onUpdate={fetchRecipes}
          />
        )}
      </div>
    </Layout>
  );
}