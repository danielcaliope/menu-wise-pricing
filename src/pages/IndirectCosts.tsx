import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Building2, Package, DollarSign, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRecipeIndirectCosts, useAddRecipeIndirectCost, useDeleteRecipeIndirectCost } from "@/features/recipes/api";
import { useOperatingCosts, useCreateOperatingCost, useDeleteOperatingCost, type OperatingCostType } from "@/features/costs/api";

const IndirectCosts = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Array<{ id: string; name: string }>>([]);
  const { operatingCosts: indirectCosts, isLoading: loadingOperatingCosts } = useOperatingCosts();
  const createOperatingCost = useCreateOperatingCost();
  const deleteOperatingCost = useDeleteOperatingCost();
  const { recipeIndirectCosts } = useRecipeIndirectCosts();
  const addCost = useAddRecipeIndirectCost();
  const deleteCost = useDeleteRecipeIndirectCost();

  // Form states
  const [newCost, setNewCost] = useState({
    name: "",
    cost_type: "fixed_monthly" as OperatingCostType,
    amount: "",
    description: "",
  });

  const [newRecipeCost, setNewRecipeCost] = useState({
    recipe_id: "",
    cost_name: "",
    amount: "",
    cost_type: "packaging" as "packaging" | "labor" | "other",
    notes: "",
  });

  const [isAddingCost, setIsAddingCost] = useState(false);
  const [isAddingRecipeCost, setIsAddingRecipeCost] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("recipes")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      if (data) setRecipes(data);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as receitas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddIndirectCost = async () => {
    if (!newCost.name || !newCost.amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e valor do custo.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCost(true);
    try {
      await createOperatingCost.mutateAsync({
        name: newCost.name,
        cost_type: newCost.cost_type,
        amount: parseFloat(newCost.amount),
        description: newCost.description || null,
      });

      toast({
        title: "Custo adicionado",
        description: "O custo indireto foi cadastrado com sucesso.",
      });

      setNewCost({ name: "", cost_type: "fixed_monthly", amount: "", description: "" });
    } catch (error) {
      console.error("Error adding cost:", error);
      toast({
        title: "Erro ao adicionar custo",
        description: "Não foi possível cadastrar o custo indireto.",
        variant: "destructive",
      });
    } finally {
      setIsAddingCost(false);
    }
  };

  const handleAddRecipeCost = async () => {
    if (!newRecipeCost.recipe_id || !newRecipeCost.cost_name || !newRecipeCost.amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione a receita e preencha nome e valor.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingRecipeCost(true);
    try {
      await addCost.mutateAsync({
        recipe_id: newRecipeCost.recipe_id,
        cost_name: newRecipeCost.cost_name,
        amount: parseFloat(newRecipeCost.amount),
        cost_type: newRecipeCost.cost_type,
        notes: newRecipeCost.notes || null,
      });

      toast({
        title: "Custo adicionado à receita",
        description: "O custo foi vinculado à receita com sucesso.",
      });

      setNewRecipeCost({ recipe_id: "", cost_name: "", amount: "", cost_type: "packaging", notes: "" });
    } catch (error) {
      console.error("Error adding recipe cost:", error);
      toast({
        title: "Erro ao adicionar custo",
        description: "Não foi possível vincular o custo à receita.",
        variant: "destructive",
      });
    } finally {
      setIsAddingRecipeCost(false);
    }
  };

  const handleDeleteIndirectCost = async (id: string) => {
    try {
      await deleteOperatingCost.mutateAsync(id);

      toast({
        title: "Custo removido",
        description: "O custo indireto foi excluído.",
      });
    } catch (error) {
      console.error("Error deleting cost:", error);
      toast({
        title: "Erro ao remover custo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecipeCost = async (id: string) => {
    try {
      await deleteCost.mutateAsync(id);

      toast({
        title: "Custo removido",
        description: "O custo foi desvinculado da receita.",
      });
    } catch (error) {
      console.error("Error deleting recipe cost:", error);
      toast({
        title: "Erro ao remover custo",
        variant: "destructive",
      });
    }
  };

  const getTotalFixedCosts = () => {
    return indirectCosts
      .filter((cost) => cost.cost_type === "fixed_monthly")
      .reduce((sum, cost) => sum + Number(cost.amount), 0);
  };

  const getTotalVariableCosts = () => {
    return indirectCosts
      .filter((cost) => cost.cost_type === "variable")
      .reduce((sum, cost) => sum + Number(cost.amount), 0);
  };

  if (loading || loadingOperatingCosts) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Custos Indiretos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie custos fixos, variáveis e custos específicos por receita
          </p>
        </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Fixos Mensais</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {getTotalFixedCosts().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Aluguel, água, luz, etc.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Variáveis</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {getTotalVariableCosts().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Custos que variam com produção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos por Receita</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipeIndirectCosts.length}</div>
            <p className="text-xs text-muted-foreground">Custos vinculados a receitas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fixed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fixed">Custos Fixos e Variáveis</TabsTrigger>
          <TabsTrigger value="recipe">Custos por Receita</TabsTrigger>
        </TabsList>

        <TabsContent value="fixed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Custo Fixo/Variável</CardTitle>
              <CardDescription>
                Custos fixos são mensais (aluguel, água). Variáveis dependem da produção.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cost-name">Nome do Custo</Label>
                  <Input
                    id="cost-name"
                    placeholder="Ex: Aluguel, Energia, Gás"
                    value={newCost.name}
                    onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost-type">Tipo</Label>
                  <Select
                    value={newCost.cost_type}
                    onValueChange={(value: "fixed_monthly" | "variable") =>
                      setNewCost({ ...newCost, cost_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_monthly">Fixo Mensal</SelectItem>
                      <SelectItem value="variable">Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost-amount">Valor (R$)</Label>
                  <Input
                    id="cost-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newCost.amount}
                    onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost-description">Descrição (opcional)</Label>
                  <Input
                    id="cost-description"
                    placeholder="Detalhes do custo"
                    value={newCost.description}
                    onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleAddIndirectCost} disabled={isAddingCost}>
                {isAddingCost ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Adicionar Custo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {indirectCosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum custo indireto cadastrado ainda.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indirectCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">{cost.name}</TableCell>
                        <TableCell>
                          {cost.cost_type === "fixed_monthly" ? "Fixo Mensal" : "Variável"}
                        </TableCell>
                        <TableCell>R$ {Number(cost.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {cost.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteIndirectCost(cost.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Custo à Receita</CardTitle>
              <CardDescription>
                Vincule custos específicos como embalagem e mão de obra a cada receita.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recipe-select">Receita</Label>
                  <Select
                    value={newRecipeCost.recipe_id}
                    onValueChange={(value) =>
                      setNewRecipeCost({ ...newRecipeCost, recipe_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a receita" />
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

                <div className="space-y-2">
                  <Label htmlFor="recipe-cost-type">Tipo de Custo</Label>
                  <Select
                    value={newRecipeCost.cost_type}
                    onValueChange={(value: "packaging" | "labor" | "other") =>
                      setNewRecipeCost({ ...newRecipeCost, cost_type: value })
                    }
                  >
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
                  <Label htmlFor="recipe-cost-name">Nome do Custo</Label>
                  <Input
                    id="recipe-cost-name"
                    placeholder="Ex: Embalagem plástica"
                    value={newRecipeCost.cost_name}
                    onChange={(e) =>
                      setNewRecipeCost({ ...newRecipeCost, cost_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipe-cost-amount">Valor (R$)</Label>
                  <Input
                    id="recipe-cost-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newRecipeCost.amount}
                    onChange={(e) =>
                      setNewRecipeCost({ ...newRecipeCost, amount: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="recipe-cost-notes">Observações (opcional)</Label>
                  <Textarea
                    id="recipe-cost-notes"
                    placeholder="Detalhes sobre o custo"
                    value={newRecipeCost.notes}
                    onChange={(e) =>
                      setNewRecipeCost({ ...newRecipeCost, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleAddRecipeCost} disabled={isAddingRecipeCost}>
                {isAddingRecipeCost ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Adicionar à Receita
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custos por Receita</CardTitle>
            </CardHeader>
            <CardContent>
              {recipeIndirectCosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum custo vinculado a receitas ainda.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receita</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipeIndirectCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">
                          {cost.recipes?.name || "Receita não encontrada"}
                        </TableCell>
                        <TableCell>
                          {cost.cost_type === "packaging"
                            ? "Embalagem"
                            : cost.cost_type === "labor"
                            ? "Mão de Obra"
                            : "Outro"}
                        </TableCell>
                        <TableCell>{cost.cost_name}</TableCell>
                        <TableCell>R$ {Number(cost.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {cost.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRecipeCost(cost.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </Layout>
  );
};

export default IndirectCosts;