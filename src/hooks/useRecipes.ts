import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Recipe } from "@/schemas/recipe";

export type RecipeWritePayload = {
  name: string;
  waste_percentage: number;
  prep_time_minutes: number;
  notes: string;
  category_id: string | null;
  default_servings: number;
};

export function useRecipes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["recipes"],
    queryFn: async (): Promise<Recipe[]> => {
      const { data, error } = await supabase.from("recipes").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const createRecipe = useMutation({
    mutationFn: async (payload: RecipeWritePayload): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("recipes")
        .insert([{ ...payload, user_id: user.id }])
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });

  const updateRecipe = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: RecipeWritePayload }) => {
      const { error } = await supabase.from("recipes").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });

  return {
    recipes: query.data ?? [],
    isLoading: query.isLoading,
    createRecipe,
    updateRecipe,
    deleteRecipe,
  };
}
