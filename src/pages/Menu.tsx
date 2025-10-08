import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, ChefHat } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
};

type Recipe = {
  id: string;
  name: string;
  prep_time_minutes: number;
  notes: string | null;
  category_id: string | null;
  default_servings: number;
};

type PricingInfo = {
  price_without_delivery: number | null;
  price_with_delivery: number | null;
  delivery_fee_percentage: number | null;
};

type MenuRecipe = Recipe & {
  pricing?: PricingInfo;
  category?: Category;
};

export default function Menu() {
  const [recipes, setRecipes] = useState<MenuRecipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (categoriesError) throw categoriesError;

      // Fetch recipes
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .order("name");

      if (recipesError) throw recipesError;

      // Fetch latest pricing for each recipe
      const recipesWithPricing = await Promise.all(
        (recipesData || []).map(async (recipe) => {
          const { data: pricingData } = await supabase
            .from("pricing_history")
            .select("price_without_delivery, price_with_delivery, delivery_fee_percentage")
            .eq("recipe_id", recipe.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const category = categoriesData?.find(cat => cat.id === recipe.category_id);

          return {
            ...recipe,
            pricing: pricingData || undefined,
            category,
          };
        })
      );

      setCategories(categoriesData || []);
      setRecipes(recipesWithPricing);
    } catch (error) {
      toast({
        title: "Erro ao carregar cardápio",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe => 
    selectedCategory === "all" || recipe.category_id === selectedCategory
  );

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "Sob consulta";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Carregando cardápio...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary text-primary-foreground py-12 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center">Nosso Cardápio</h1>
          <p className="text-lg text-center opacity-90">Pratos especiais preparados com carinho</p>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-12">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="w-full justify-start mb-8 flex-wrap h-auto gap-2">
            <TabsTrigger value="all" className="gap-2">
              <ChefHat className="h-4 w-4" />
              Todos
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="gap-2">
                <span>{category.icon}</span>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0">
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mb-2">Nenhum prato disponível</h2>
                <p className="text-muted-foreground">Em breve teremos novidades!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-smooth">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-semibold">{recipe.name}</h3>
                        {recipe.category && (
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: recipe.category.color || "#3b82f6",
                              color: "white"
                            }}
                          >
                            {recipe.category.icon} {recipe.category.name}
                          </Badge>
                        )}
                      </div>

                      {recipe.notes && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {recipe.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{recipe.prep_time_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChefHat className="h-4 w-4" />
                          <span>{recipe.default_servings} {recipe.default_servings === 1 ? 'porção' : 'porções'}</span>
                        </div>
                      </div>

                      {recipe.pricing ? (
                        <div className="space-y-2 border-t pt-4">
                          {recipe.pricing.price_without_delivery && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Preço:</span>
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(recipe.pricing.price_without_delivery)}
                              </span>
                            </div>
                          )}
                          {recipe.pricing.price_with_delivery && 
                           recipe.pricing.delivery_fee_percentage && 
                           recipe.pricing.delivery_fee_percentage > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                Com delivery (+{recipe.pricing.delivery_fee_percentage}%):
                              </span>
                              <span className="text-base font-semibold text-accent">
                                {formatPrice(recipe.pricing.price_with_delivery)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border-t pt-4">
                          <p className="text-center text-muted-foreground text-sm">
                            Preço sob consulta
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
