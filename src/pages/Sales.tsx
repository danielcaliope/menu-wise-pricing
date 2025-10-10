import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Sale {
  id: string;
  recipe_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  cost_per_unit: number;
  total_cost: number;
  profit: number;
  sale_date: string;
  customer_name: string | null;
  notes: string | null;
}

interface Recipe {
  id: string;
  name: string;
}

const Sales = () => {
  const [open, setOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("0");

  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes", session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("id, name")
        .eq("user_id", session?.user?.id)
        .order("name");
      
      if (error) throw error;
      return data as Recipe[];
    },
    enabled: !!session?.user?.id,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales", session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          recipes (name)
        `)
        .eq("user_id", session?.user?.id)
        .order("sale_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const createSale = useMutation({
    mutationFn: async (newSale: {
      recipe_id: string;
      quantity: number;
      unit_price: number;
      total_amount: number;
      cost_per_unit: number;
      total_cost: number;
      profit: number;
      customer_name: string | null;
      notes: string | null;
    }) => {
      const { data, error } = await supabase
        .from("sales")
        .insert([{ ...newSale, user_id: session?.user?.id! }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venda registrada com sucesso!");
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao registrar venda");
      console.error(error);
    },
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venda excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir venda");
    },
  });

  const resetForm = () => {
    setSelectedRecipeId("");
    setQuantity("1");
    setUnitPrice("");
    setCostPerUnit("0");
    setCustomerName("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const qty = parseInt(quantity);
    const price = parseFloat(unitPrice);
    const cost = parseFloat(costPerUnit);
    const totalAmount = qty * price;
    const totalCost = qty * cost;
    const profit = totalAmount - totalCost;

    createSale.mutate({
      recipe_id: selectedRecipeId,
      quantity: qty,
      unit_price: price,
      total_amount: totalAmount,
      cost_per_unit: cost,
      total_cost: totalCost,
      profit: profit,
      customer_name: customerName || null,
      notes: notes || null,
    });
  };

  const totalSales = sales.reduce((sum, sale) => sum + parseFloat(String(sale.total_amount)), 0);
  const totalProfit = sales.reduce((sum, sale) => sum + parseFloat(String(sale.profit)), 0);
  const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Vendas</h1>
            <p className="text-muted-foreground">
              Registre e acompanhe suas vendas
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Nova Venda</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipe">Receita *</Label>
                  <Select
                    value={selectedRecipeId}
                    onValueChange={setSelectedRecipeId}
                    required
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

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Preço Unitário (R$) *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costPerUnit">Custo Unitário (R$) *</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerName">Nome do Cliente</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Venda</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalSales.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantity}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale: any) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.sale_date), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{sale.recipes?.name}</TableCell>
                    <TableCell>{sale.customer_name || "-"}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right">
                      R$ {parseFloat(sale.unit_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {parseFloat(sale.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {parseFloat(sale.profit).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSale.mutate(sale.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Sales;