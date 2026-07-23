import { supabase } from "@/integrations/supabase/client";

// Guarda de autenticação repetida em quase toda mutação da API por feature —
// centralizada aqui pra toda mutação falhar com a mesma mensagem.
export async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return user;
}
