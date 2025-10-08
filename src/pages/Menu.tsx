import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, ChefHat, Coffee, IceCream, Salad, Pizza, Cake, Wine, UtensilsCrossed, Cookie, Soup, Fish, Beef, Tag, Trash2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";

const ICON_MAP: Record<string, LucideIcon> = {
  ChefHat,
  Coffee,
  IceCream,
  Salad,
  Pizza,
  Cake,
  Wine,
  UtensilsCrossed,
  Cookie,
  Soup,
  Fish,
  Beef,
  Tag,
};

const CategoryIcon = ({ iconName, className }: { iconName: string | null; className?: string }) => {
  const Icon = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : Tag;
  return <Icon className={className} />;
};

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchMenuData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

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

  const handleDeleteRecipe = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}" do cardápio?`)) return;

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Item excluído do cardápio!" });
      fetchMenuData();
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
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Carregando cardápio...</h1>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">Cardápio Digital</h1>
        <p className="text-lg text-muted-foreground">Pratos especiais preparados com carinho</p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="w-full justify-start mb-8 flex-wrap h-auto gap-2">
          <TabsTrigger value="all" className="gap-2">
            <ChefHat className="h-4 w-4" />
            Todos
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="gap-2">
              <CategoryIcon iconName={category.icon} className="h-4 w-4" />
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
                      <div className="flex items-center gap-2">
                        {recipe.category && (
                          <Badge
                            variant="secondary"
                            className="gap-1.5"
                            style={{
                              backgroundColor: recipe.category.color || "#3b82f6",
                              color: "white"
                            }}
                          >
                            <CategoryIcon iconName={recipe.category.icon} className="h-4 w-4" />
                            {recipe.category.name}
                          </Badge>
                        )}
                        {isAuthenticated && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteRecipe(recipe.id, recipe.name)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
    </Layout>
  );
}
