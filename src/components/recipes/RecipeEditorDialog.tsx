import { useEffect, useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { recipeSchema, type Recipe } from "@/schemas/recipe";
import { useRecipes } from "@/hooks/useRecipes";
import { useRecipeFinancials } from "@/hooks/useRecipeFinancials";
import { RecipeDetailsForm, type RecipeDetailsFormState } from "@/components/recipes/RecipeDetailsForm";
import { RecipeIngredientsEditor } from "@/components/recipes/RecipeIngredientsEditor";
import { RecipeIndirectCostsEditor } from "@/components/recipes/RecipeIndirectCostsEditor";
import { RecipeFinancialSummary } from "@/components/recipes/RecipeFinancialSummary";

type Ingredient = { id: string; name: string; unit: string; unit_cost: number };
type Category = { id: string; name: string; icon: string | null };

const EMPTY_FORM: RecipeDetailsFormState = {
  name: "",
  waste_percentage: "0",
  prep_time_minutes: "0",
  notes: "",
  category_id: "",
  default_servings: "1",
};

type RecipeEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRecipe: Recipe | null;
  ingredients: Ingredient[];
  categories: Category[];
};

export function RecipeEditorDialog({ open, onOpenChange, editingRecipe, ingredients, categories }: RecipeEditorDialogProps) {
  const { createRecipe, updateRecipe } = useRecipes();
  const [formData, setFormData] = useState<RecipeDetailsFormState>(EMPTY_FORM);
  const [recipeId, setRecipeId] = useState<string | null>(null);

  const isEditing = !!editingRecipe;

  useEffect(() => {
    if (!open) return;

    if (editingRecipe) {
      setFormData({
        name: editingRecipe.name,
        waste_percentage: editingRecipe.waste_percentage.toString(),
        prep_time_minutes: editingRecipe.prep_time_minutes.toString(),
        notes: editingRecipe.notes || "",
        category_id: editingRecipe.category_id || "",
        default_servings: editingRecipe.default_servings.toString(),
      });
      setRecipeId(editingRecipe.id);
    } else {
      setFormData(EMPTY_FORM);
      setRecipeId(null);
    }
  }, [open, editingRecipe]);

  const liveWastePercentage = parseFloat(formData.waste_percentage) || 0;
  const financials = useRecipeFinancials(recipeId, liveWastePercentage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = recipeSchema.parse({
        name: formData.name,
        waste_percentage: parseFloat(formData.waste_percentage),
        prep_time_minutes: parseInt(formData.prep_time_minutes),
        notes: formData.notes,
      });

      const payload = {
        name: validated.name,
        waste_percentage: validated.waste_percentage,
        prep_time_minutes: validated.prep_time_minutes,
        notes: validated.notes || "",
        category_id: formData.category_id || null,
        default_servings: parseInt(formData.default_servings),
      };

      if (recipeId) {
        await updateRecipe.mutateAsync({ id: recipeId, payload });
        toast({ title: "Receita atualizada com sucesso!" });
      } else {
        const newId = await createRecipe.mutateAsync(payload);
        setRecipeId(newId);
        toast({ title: "Receita criada! Agora adicione os ingredientes abaixo." });
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Receita" : "Nova Receita"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <RecipeDetailsForm formData={formData} onChange={setFormData} categories={categories} />
          <Button type="submit" className="w-full" disabled={createRecipe.isPending || updateRecipe.isPending}>
            {recipeId ? "Salvar Dados da Receita" : "Continuar"}
          </Button>
        </form>

        {recipeId && (
          <div className="space-y-6">
            <Separator />
            <RecipeIngredientsEditor recipeId={recipeId} ingredients={ingredients} />
            <Separator />
            <RecipeIndirectCostsEditor recipeId={recipeId} />
            <Separator />
            <RecipeFinancialSummary data={financials} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
