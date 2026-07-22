import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  plan: string | null;
  [key: string]: unknown;
};

export function useProfile() {
  const query = useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
  });

  return { profile: query.data ?? null, isLoading: query.isLoading };
}
