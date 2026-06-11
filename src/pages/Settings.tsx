import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StatsSkeleton } from "@/components/SkeletonLoader";
import { Onboarding } from "@/components/Onboarding";
import { GraduationCap } from "lucide-react";

// Validação de segurança para prevenir SQL injection e code injection
const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos"),
  location_city: z.string()
    .trim()
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]*$/, "Cidade contém caracteres inválidos")
    .optional(),
  location_state: z.string()
    .trim()
    .max(50, "Estado deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]*$/, "Estado contém caracteres inválidos")
    .optional(),
  location_cep: z.string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido (formato: 00000-000)")
    .optional()
    .or(z.literal("")),
});

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    plan: "free",
    location_city: "",
    location_state: "",
    location_cep: "",
  });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        plan: data.plan || "free",
        location_city: data.location_city || "",
        location_state: data.location_state || "",
        location_cep: data.location_cep || "",
      });
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validação com Zod para prevenir injection attacks
      const validated = profileSchema.parse({
        full_name: profile.full_name,
        location_city: profile.location_city || undefined,
        location_state: profile.location_state || undefined,
        location_cep: profile.location_cep || undefined,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validated.full_name,
          location_city: validated.location_city || null,
          location_state: validated.location_state || null,
          location_cep: validated.location_cep || null,
        })
        .eq("id", user.id);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Perfil atualizado!",
          description: "Suas informações foram salvas com sucesso",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao atualizar",
          description: "Ocorreu um erro inesperado",
          variant: "destructive",
        });
      }
    }
  };

  const handleTogglePlan = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPlan = profile.plan === "free" ? "paid" : "free";

    const { error } = await supabase
      .from("profiles")
      .update({ plan: newPlan })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Erro ao alterar plano",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProfile({ ...profile, plan: newPlan });
      toast({
        title: `Plano alterado para ${newPlan === "paid" ? "Pago" : "Gratuito"}!`,
        description: `Agora você ${newPlan === "paid" ? "pode usar o fator regional" : "não pode usar o fator regional"}`,
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <Breadcrumbs items={[{ label: "Configurações" }]} />
          <StatsSkeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Onboarding open={showTour} onOpenChange={setShowTour} />
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <Breadcrumbs items={[{ label: "Configurações" }]} />
        
        <div>
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie seu perfil e configurações da conta
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tutorial de Configuração</CardTitle>
            <CardDescription>
              Reveja o passo a passo para deixar o sistema funcionando por completo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setShowTour(true)} className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Ver tutorial novamente
            </Button>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Plano Atual</CardTitle>
            <CardDescription>
              Seu plano determina os recursos disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant={profile.plan === "paid" ? "default" : "secondary"}>
                    {profile.plan === "paid" ? "Plano Pago" : "Plano Gratuito"}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    {profile.plan === "free"
                      ? "Até 5 fichas técnicas · Fator regional desabilitado"
                      : "Fichas ilimitadas · Fator regional ativado"}
                  </p>
                </div>
                {profile.plan === "free" && (
                  <Button variant="outline">
                    Fazer Upgrade
                  </Button>
                )}
              </div>

              {/* Development Mode Toggle */}
              <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-warning text-warning-foreground">
                        DEV MODE
                      </Badge>
                      <span className="font-semibold text-sm">Alternar Plano</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Apenas para testes - alterna entre plano gratuito e pago
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePlan}
                    className="gap-2"
                  >
                    {profile.plan === "free" ? "→ Premium" : "→ Gratuito"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize suas informações de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={profile.location_city}
                    onChange={(e) => setProfile({ ...profile, location_city: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={profile.location_state}
                    onChange={(e) => setProfile({ ...profile, location_state: e.target.value })}
                    maxLength={50}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={profile.location_cep}
                  onChange={(e) => setProfile({ ...profile, location_cep: e.target.value })}
                  placeholder="00000-000"
                  maxLength={9}
                  pattern="\d{5}-?\d{3}"
                />
              </div>
              <Button type="submit" className="w-full">
                Salvar Alterações
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}