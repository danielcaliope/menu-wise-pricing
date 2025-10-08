import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Minus, Plus, Edit, Trash2, BarChart3 } from "lucide-react";

interface Recipe {
  id: string;
  name: string;
}

interface CompetitiveAnalysis {
  id: string;
  competitor_name: string;
  recipe_id: string;
  competitor_price: number;
  our_price: number;
  price_difference_percentage: number;
  market_position: 'cheaper' | 'similar' | 'premium';
  notes: string | null;
  recipes: Recipe;
}

export default function CompetitiveAnalysis() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    competitor_name: "",
    recipe_id: "",
    competitor_price: "",
    notes: ""
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("recipes")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      return data as Recipe[];
    }
  });

  const { data: pricingHistory } = useQuery({
    queryKey: ["pricing-history-for-analysis"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("pricing_history")
        .select("recipe_id, suggested_price")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ["competitive-analysis"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("competitive_analysis")
        .select("*, recipes(id, name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CompetitiveAnalysis[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const competitorPrice = parseFloat(data.competitor_price);
      
      // Get our price from pricing history
      const ourPriceData = pricingHistory?.find(p => p.recipe_id === data.recipe_id);
      const ourPrice = ourPriceData?.suggested_price || 0;

      const priceDiff = ((competitorPrice - ourPrice) / ourPrice) * 100;
      
      let marketPosition: 'cheaper' | 'similar' | 'premium';
      if (Math.abs(priceDiff) < 5) {
        marketPosition = 'similar';
      } else if (priceDiff > 0) {
        marketPosition = 'cheaper'; // competitor is more expensive, we're cheaper
      } else {
        marketPosition = 'premium'; // competitor is cheaper, we're premium
      }

      const payload = {
        user_id: user.id,
        competitor_name: data.competitor_name,
        recipe_id: data.recipe_id,
        competitor_price: competitorPrice,
        our_price: ourPrice,
        price_difference_percentage: priceDiff,
        market_position: marketPosition,
        notes: data.notes || null
      };

      if (editingId) {
        const { error } = await supabase
          .from("competitive_analysis")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("competitive_analysis")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitive-analysis"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingId ? "Análise atualizada" : "Análise criada",
        description: "Dados salvos com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("competitive_analysis")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitive-analysis"] });
      toast({
        title: "Análise excluída",
        description: "Dados removidos com sucesso"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      competitor_name: "",
      recipe_id: "",
      competitor_price: "",
      notes: ""
    });
    setEditingId(null);
  };

  const handleEdit = (analysis: CompetitiveAnalysis) => {
    setFormData({
      competitor_name: analysis.competitor_name,
      recipe_id: analysis.recipe_id,
      competitor_price: analysis.competitor_price.toString(),
      notes: analysis.notes || ""
    });
    setEditingId(analysis.id);
    setIsDialogOpen(true);
  };

  const getPositionBadge = (position: string) => {
    switch (position) {
      case 'cheaper':
        return <Badge className="bg-green-500">Mais Barato</Badge>;
      case 'premium':
        return <Badge className="bg-blue-500">Premium</Badge>;
      case 'similar':
        return <Badge variant="secondary">Similar</Badge>;
      default:
        return null;
    }
  };

  const getPositionIcon = (diff: number) => {
    if (Math.abs(diff) < 5) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  if (isLoading) {
    return <Layout>Carregando...</Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Análise de Competitividade</h2>
            <p className="text-muted-foreground">
              Compare seus preços com a concorrência
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Análise
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Análise" : "Nova Análise Competitiva"}
                </DialogTitle>
                <DialogDescription>
                  Compare o preço de seus pratos com a concorrência
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="competitor_name">Nome do Concorrente</Label>
                  <Input
                    id="competitor_name"
                    value={formData.competitor_name}
                    onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
                    placeholder="Ex: Restaurante XYZ"
                  />
                </div>
                <div>
                  <Label htmlFor="recipe_id">Prato/Receita</Label>
                  <Select
                    value={formData.recipe_id}
                    onValueChange={(value) => setFormData({ ...formData, recipe_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um prato" />
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
                <div>
                  <Label htmlFor="competitor_price">Preço do Concorrente (R$)</Label>
                  <Input
                    id="competitor_price"
                    type="number"
                    step="0.01"
                    value={formData.competitor_price}
                    onChange={(e) => setFormData({ ...formData, competitor_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Detalhes sobre o concorrente, qualidade, porções, etc."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => saveMutation.mutate(formData)}
                  disabled={!formData.competitor_name || !formData.recipe_id || !formData.competitor_price}
                >
                  {editingId ? "Atualizar" : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {analyses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground">
                Nenhuma análise de competitividade registrada ainda.
                <br />
                Comece adicionando dados da concorrência.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analyses.map((analysis) => (
              <Card key={analysis.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{analysis.recipes.name}</CardTitle>
                      <CardDescription>{analysis.competitor_name}</CardDescription>
                    </div>
                    {getPositionBadge(analysis.market_position)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Nosso Preço:</span>
                      <span className="font-semibold">R$ {analysis.our_price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Concorrente:</span>
                      <span className="font-semibold">R$ {analysis.competitor_price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Diferença:</span>
                      <div className="flex items-center gap-2">
                        {getPositionIcon(analysis.price_difference_percentage)}
                        <span className={`font-semibold ${
                          Math.abs(analysis.price_difference_percentage) < 5 
                            ? 'text-muted-foreground' 
                            : analysis.price_difference_percentage > 0 
                            ? 'text-red-500' 
                            : 'text-green-500'
                        }`}>
                          {analysis.price_difference_percentage > 0 ? '+' : ''}
                          {analysis.price_difference_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {analysis.notes && (
                      <p className="text-sm text-muted-foreground pt-2 border-t">
                        {analysis.notes}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(analysis)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => deleteMutation.mutate(analysis.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
