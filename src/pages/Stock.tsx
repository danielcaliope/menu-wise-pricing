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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Package, Plus, Minus, AlertTriangle, History, TrendingDown } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { SearchBar } from "@/components/SearchBar";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
};

type StockItem = {
  id: string;
  ingredient_id: string;
  current_quantity: number;
  min_quantity: number;
  last_updated: string;
  ingredients: Ingredient;
};

type StockMovement = {
  id: string;
  ingredient_id: string;
  movement_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  notes: string | null;
  created_at: string;
  ingredients: Ingredient;
};

export default function Stock() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    ingredient_id: "",
    movement_type: "entrada",
    quantity: "",
    notes: "",
  });
  const [minQuantityDialog, setMinQuantityDialog] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [minQuantity, setMinQuantity] = useState("");

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await Promise.all([fetchStock(), fetchIngredients(), fetchMovements()]);
  };

  const fetchStock = async () => {
    const { data, error } = await supabase
      .from("ingredient_stock")
      .select(`
        *,
        ingredients (id, name, unit, unit_cost)
      `)
      .order("ingredients(name)");

    if (error) {
      toast({
        title: "Erro ao carregar estoque",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStock(data || []);
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

  const fetchMovements = async () => {
    const { data, error } = await supabase
      .from("stock_movements")
      .select(`
        *,
        ingredients (id, name, unit, unit_cost)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast({
        title: "Erro ao carregar movimentações",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMovements(data || []);
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Erro",
        description: "Quantidade inválida",
        variant: "destructive",
      });
      return;
    }

    // Get current stock
    const { data: currentStock } = await supabase
      .from("ingredient_stock")
      .select("current_quantity")
      .eq("ingredient_id", formData.ingredient_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const previousQty = currentStock?.current_quantity || 0;
    let newQty = previousQty;

    if (formData.movement_type === "entrada") {
      newQty = previousQty + quantity;
    } else if (formData.movement_type === "saida") {
      newQty = Math.max(0, previousQty - quantity);
    } else {
      newQty = quantity;
    }

    // Insert movement
    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert([{
        user_id: user.id,
        ingredient_id: formData.ingredient_id,
        movement_type: formData.movement_type,
        quantity,
        previous_quantity: previousQty,
        new_quantity: newQty,
        notes: formData.notes || null,
      }]);

    if (movementError) {
      toast({
        title: "Erro ao registrar movimentação",
        description: movementError.message,
        variant: "destructive",
      });
      return;
    }

    // Update stock
    const { error: stockError } = await supabase
      .from("ingredient_stock")
      .upsert({
        user_id: user.id,
        ingredient_id: formData.ingredient_id,
        current_quantity: newQty,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'user_id,ingredient_id'
      });

    if (stockError) {
      toast({
        title: "Erro ao atualizar estoque",
        description: stockError.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Movimentação registrada com sucesso!" });
      setDialogOpen(false);
      resetForm();
      fetchStock();
      fetchMovements();
    }
  };

  const handleUpdateMinQuantity = async () => {
    if (!selectedStockItem) return;

    const minQty = parseFloat(minQuantity);
    if (isNaN(minQty) || minQty < 0) {
      toast({
        title: "Erro",
        description: "Quantidade mínima inválida",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("ingredient_stock")
      .update({ min_quantity: minQty })
      .eq("id", selectedStockItem.id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Estoque mínimo atualizado!" });
      setMinQuantityDialog(false);
      setSelectedStockItem(null);
      fetchStock();
    }
  };

  const resetForm = () => {
    setFormData({
      ingredient_id: "",
      movement_type: "entrada",
      quantity: "",
      notes: "",
    });
  };

  const openMinQuantityDialog = (item: StockItem) => {
    setSelectedStockItem(item);
    setMinQuantity(item.min_quantity.toString());
    setMinQuantityDialog(true);
  };

  const filteredStock = stock.filter(item =>
    item.ingredients.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = stock.filter(
    item => item.current_quantity < item.min_quantity
  );

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <Breadcrumbs items={[{ label: "Controle de Estoque" }]} />
          <div>
            <h1 className="text-3xl font-bold mb-2">Controle de Estoque</h1>
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
        <Breadcrumbs items={[{ label: "Controle de Estoque" }]} />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Controle de Estoque</h1>
            <p className="text-muted-foreground">
              Gerencie o estoque de ingredientes e acompanhe movimentações
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setHistoryDialogOpen(true)}
            >
              <History className="h-4 w-4" />
              Histórico
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Package className="h-4 w-4" />
                  Nova Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Movimentação</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMovement} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ingredient">Ingrediente</Label>
                    <Select
                      value={formData.ingredient_id}
                      onValueChange={(value) => setFormData({ ...formData, ingredient_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Movimentação</Label>
                    <Select
                      value={formData.movement_type}
                      onValueChange={(value) => setFormData({ ...formData, movement_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-green-500" />
                            Entrada
                          </div>
                        </SelectItem>
                        <SelectItem value="saida">
                          <div className="flex items-center gap-2">
                            <Minus className="h-4 w-4 text-red-500" />
                            Saída
                          </div>
                        </SelectItem>
                        <SelectItem value="ajuste">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-blue-500" />
                            Ajuste
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ex: Compra do fornecedor X"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Registrar Movimentação
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <Card className="border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <div>
                      <p className="font-medium">{item.ingredients.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Estoque atual: {item.current_quantity} {item.ingredients.unit}
                        {" | "}Mínimo: {item.min_quantity} {item.ingredients.unit}
                      </p>
                    </div>
                    <Badge variant="destructive">Baixo</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Estoque Atual</CardTitle>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar ingrediente..."
                className="w-full sm:w-72"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredStock.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum item em estoque
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Quantidade Atual</TableHead>
                    <TableHead>Estoque Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((item) => {
                    const isLow = item.current_quantity < item.min_quantity;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.ingredients.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isLow ? "destructive" : "secondary"}>
                            {item.current_quantity} {item.ingredients.unit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.min_quantity} {item.ingredients.unit}
                        </TableCell>
                        <TableCell>
                          {isLow ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Baixo
                            </Badge>
                          ) : (
                            <Badge variant="outline">Normal</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMinQuantityDialog(item)}
                          >
                            Definir Mínimo
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Movimentações
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {movements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma movimentação registrada
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.ingredients.name}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              movement.movement_type === "entrada" ? "default" :
                              movement.movement_type === "saida" ? "destructive" :
                              "secondary"
                            }
                          >
                            {movement.movement_type === "entrada" && <Plus className="h-3 w-3 mr-1" />}
                            {movement.movement_type === "saida" && <Minus className="h-3 w-3 mr-1" />}
                            {movement.movement_type === "ajuste" && <TrendingDown className="h-3 w-3 mr-1" />}
                            {movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {movement.quantity} {movement.ingredients.unit}
                            </p>
                            <p className="text-muted-foreground">
                              {movement.previous_quantity} → {movement.new_quantity}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={minQuantityDialog} onOpenChange={setMinQuantityDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Definir Estoque Mínimo</DialogTitle>
            </DialogHeader>
            {selectedStockItem && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Ingrediente</p>
                  <p className="font-medium">{selectedStockItem.ingredients.name}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-qty">
                    Quantidade Mínima ({selectedStockItem.ingredients.unit})
                  </Label>
                  <Input
                    id="min-qty"
                    type="number"
                    step="0.01"
                    min="0"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                  />
                </div>
                <Button onClick={handleUpdateMinQuantity} className="w-full">
                  Salvar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
