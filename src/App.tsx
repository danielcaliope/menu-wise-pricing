import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Onboarding } from "@/components/Onboarding";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Ingredients from "./pages/Ingredients";
import Recipes from "./pages/Recipes";
import Categories from "./pages/Categories";
import Stock from "./pages/Stock";
import Pricing from "./pages/Pricing";
import CostAlerts from "./pages/CostAlerts";
import CompetitiveAnalysis from "./pages/CompetitiveAnalysis";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Menu from "./pages/Menu";
import IndirectCosts from "./pages/IndirectCosts";
import Sales from "./pages/Sales";
import IfoodSettings from "./pages/IfoodSettings";
import IfoodOrders from "./pages/IfoodOrders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Onboarding />
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ingredients" element={<Ingredients />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/cost-alerts" element={<CostAlerts />} />
          <Route path="/competitive-analysis" element={<CompetitiveAnalysis />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/indirect-costs" element={<IndirectCosts />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/ifood-settings" element={<IfoodSettings />} />
          <Route path="/ifood-orders" element={<IfoodOrders />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
