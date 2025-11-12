import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link2, X } from "lucide-react";

interface ProductMappingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unmappedProducts: string[];
  onMappingComplete: () => void;
}

export function IfoodProductMapping({ open, onOpenChange, unmappedProducts, onMappingComplete }: ProductMappingProps) {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadRecipes();
      loadExistingMappings();
    }
  }, [open]);

  const loadRecipes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('recipes')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const loadExistingMappings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ifood_product_mappings')
        .select('product_name, recipe_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const mappingsObj: Record<string, string> = {};
      data?.forEach(m => {
        mappingsObj[m.product_name] = m.recipe_id;
      });
      setMappings(mappingsObj);
    } catch (error) {
      console.error('Error loading mappings:', error);
    }
  };

  const handleMappingChange = (productName: string, recipeId: string) => {
    setMappings(prev => ({
      ...prev,
      [productName]: recipeId
    }));
  };

  const handleRemoveMapping = (productName: string) => {
    setMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[productName];
      return newMappings;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Delete old mappings for these products
      const { error: deleteError } = await supabase
        .from('ifood_product_mappings')
        .delete()
        .eq('user_id', user.id)
        .in('product_name', unmappedProducts);

      if (deleteError) throw deleteError;

      // Insert new mappings
      const mappingsToInsert = Object.entries(mappings)
        .filter(([productName]) => unmappedProducts.includes(productName))
        .map(([productName, recipeId]) => ({
          user_id: user.id,
          product_name: productName,
          recipe_id: recipeId
        }));

      if (mappingsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('ifood_product_mappings')
          .insert(mappingsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "Mapeamentos salvos!",
        description: `${mappingsToInsert.length} produtos mapeados`,
      });

      onMappingComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving mappings:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar mapeamentos",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const allMapped = unmappedProducts.every(product => mappings[product]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Mapear Produtos iFood para Receitas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Associe cada produto do iFood a uma receita do seu sistema para calcular custos e lucros automaticamente.
          </p>

          {unmappedProducts.length === 0 ? (
            <div className="text-center py-8">
              <Badge variant="outline" className="mb-2">Todos os produtos mapeados!</Badge>
              <p className="text-sm text-muted-foreground">
                Não há produtos sem mapeamento
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {unmappedProducts.map((productName) => (
                <div key={productName} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-2">{productName}</p>
                    <Select
                      value={mappings[productName] || ""}
                      onValueChange={(value) => handleMappingChange(productName, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma receita" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipes.map((recipe) => (
                          <SelectItem key={recipe.id} value={recipe.id}>
                            {recipe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {mappings[productName] && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMapping(productName)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!allMapped || saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salvar Mapeamentos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
