import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { z } from "zod";

// Validação de segurança para prevenir injection attacks
const ingredientSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-.,()]+$/, "Nome contém caracteres inválidos"),
  unit: z.string()
    .trim()
    .min(1, "Unidade é obrigatória")
    .max(20, "Unidade deve ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z\s]+$/, "Unidade contém caracteres inválidos"),
  unit_cost: z.number()
    .min(0, "Custo deve ser positivo")
    .max(999999.99, "Custo muito alto"),
  supplier: z.string()
    .trim()
    .max(100, "Fornecedor deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-.,()]*$/, "Fornecedor contém caracteres inválidos")
    .optional()
    .nullable(),
});

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
  supplier: string | null;
};

export default function Ingredients() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    unit: "g",
    unit_cost: "",
    supplier: "",
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
    fetchIngredients();
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
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate that required fields are filled
      if (!formData.name.trim()) {
        toast({
          title: "Erro de validação",
          description: "Nome do ingrediente é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (!formData.unit_cost || formData.unit_cost.trim() === "") {
        toast({
          title: "Erro de validação",
          description: "Custo unitário é obrigatório",
          variant: "destructive",
        });
        return;
      }

      const cost = parseFloat(formData.unit_cost);
      if (isNaN(cost) || cost < 0) {
        toast({
          title: "Erro de validação",
          description: "Custo unitário deve ser um número válido e positivo",
          variant: "destructive",
        });
        return;
      }

      const validated = ingredientSchema.parse({
        name: formData.name.trim(),
        unit: formData.unit,
        unit_cost: cost,
        supplier: formData.supplier.trim() || undefined,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingId) {
          const { error } = await supabase
          .from("ingredients")
          .update({
            name: validated.name,
            unit: validated.unit,
            unit_cost: validated.unit_cost,
            supplier: validated.supplier || null,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Ingrediente atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from("ingredients")
          .insert([{
            name: validated.name,
            unit: validated.unit,
            unit_cost: validated.unit_cost,
            supplier: validated.supplier || null,
            user_id: user.id,
          }]);

        if (error) throw error;
        toast({ title: "Ingrediente cadastrado com sucesso!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchIngredients();
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

  const handleEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient.id);
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      unit_cost: ingredient.unit_cost.toString(),
      supplier: ingredient.supplier || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ingrediente?")) return;

    const { error } = await supabase.from("ingredients").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Ingrediente excluído com sucesso!" });
      fetchIngredients();
    }
  };

  const resetForm = () => {
    setFormData({ name: "", unit: "g", unit_cost: "", supplier: "" });
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
            <h1 className="text-3xl font-bold mb-2">Ingredientes</h1>
            <p className="text-muted-foreground">
              Gerencie seus ingredientes e custos
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Ingrediente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Ingrediente" : "Novo Ingrediente"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={100}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Gramas (g)</SelectItem>
                      <SelectItem value="kg">Quilos (kg)</SelectItem>
                      <SelectItem value="ml">Mililitros (ml)</SelectItem>
                      <SelectItem value="l">Litros (l)</SelectItem>
                      <SelectItem value="un">Unidade (un)</SelectItem>
                      <SelectItem value="dz">Dúzia (dz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Custo Unitário (R$)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999.99"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor (opcional)</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    maxLength={100}
                    autoComplete="off"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Atualizar" : "Cadastrar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Ingredientes</CardTitle>
          </CardHeader>
          <CardContent>
            {ingredients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum ingrediente cadastrado ainda
              </p>
            ) : (
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
                      <TableCell>R$ {ingredient.unit_cost.toFixed(2)}</TableCell>
                      <TableCell>{ingredient.supplier || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(ingredient)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(ingredient.id)}
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
      </div>
    </Layout>
  );
}