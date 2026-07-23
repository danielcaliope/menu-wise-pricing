import { LayoutDashboard, Package, FileText, DollarSign, Settings, LogOut, PackageCheck, Bell, BarChart3, FileSpreadsheet, MenuSquare, Building2, ShoppingCart, ShoppingBag, Plug } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuGroups = [
  {
    label: "Visão geral",
    items: [
      { title: "Início", url: "/dashboard", icon: LayoutDashboard },
      { title: "Alertas", url: "/cost-alerts", icon: Bell },
    ],
  },
  {
    label: "Produtos",
    items: [
      { title: "Pratos", url: "/recipes", icon: FileText },
      { title: "Ingredientes", url: "/ingredients", icon: Package },
      { title: "Estoque", url: "/stock", icon: PackageCheck },
      { title: "Cardápio Digital", url: "/menu", icon: MenuSquare },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Custos da Operação", url: "/indirect-costs", icon: Building2 },
      { title: "Canais e Taxas", url: "/pricing", icon: DollarSign },
      { title: "Rentabilidade", url: "/sales", icon: ShoppingCart },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { title: "Análises", url: "/competitive-analysis", icon: BarChart3 },
      { title: "Relatórios", url: "/reports", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Integrações",
    items: [
      { title: "Configuração iFood", url: "/ifood-settings", icon: Plug },
      { title: "Pedidos iFood", url: "/ifood-orders", icon: ShoppingBag },
    ],
  },
  {
    label: "Administração",
    items: [
      { title: "Configurações", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">MW</span>
          </div>
          <span className="font-bold text-lg">MenuWise</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={navClass}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/settings">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
