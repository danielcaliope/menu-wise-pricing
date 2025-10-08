import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FileText, TrendingUp, DollarSign } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    ingredients: 0,
    recipes: 0,
    avgCost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch statistics
      const [ingredientsRes, recipesRes] = await Promise.all([
        supabase.from("ingredients").select("*", { count: "exact", head: true }),
        supabase.from("recipes").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        ingredients: ingredientsRes.count || 0,
        recipes: recipesRes.count || 0,
        avgCost: 0,
      });
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const statCards = [
    {
      title: "Ingredientes",
      value: stats.ingredients,
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Fichas Técnicas",
      value: stats.recipes,
      icon: FileText,
      color: "text-accent",
    },
    {
      title: "Custo Médio",
      value: `R$ ${stats.avgCost.toFixed(2)}`,
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Lucro Médio",
      value: "R$ 0,00",
      icon: TrendingUp,
      color: "text-warning",
    },
  ];

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
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu sistema de precificação
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao MenuWise!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando seus ingredientes e depois crie suas fichas técnicas.
              O sistema calculará automaticamente o custo e sugerirá o preço de venda ideal.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/ingredients")}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-smooth"
              >
                Cadastrar Ingredientes
              </button>
              <button
                onClick={() => navigate("/recipes")}
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 transition-smooth"
              >
                Criar Ficha Técnica
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}