import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StatsSkeleton } from "@/components/SkeletonLoader";
import { useDashboardState } from "@/hooks/useDashboardState";
import { DashboardOnboardingState } from "@/components/dashboard/DashboardOnboardingState";
import { DashboardStartingState } from "@/components/dashboard/DashboardStartingState";
import { DashboardActiveState } from "@/components/dashboard/DashboardActiveState";
import { DashboardAdvancedAnalytics } from "@/components/dashboard/DashboardAdvancedAnalytics";

export default function Dashboard() {
  const navigate = useNavigate();
  const state = useDashboardState();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  if (state === "loading") {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <Breadcrumbs items={[{ label: "Dashboard" }]} />
          <StatsSkeleton />
        </div>
      </Layout>
    );
  }

  if (state === "onboarding") {
    return (
      <Layout>
        <div className="space-y-6">
          <Breadcrumbs items={[{ label: "Dashboard" }]} />
          <DashboardOnboardingState />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
        {state === "starting" ? <DashboardStartingState /> : <DashboardActiveState />}
        <DashboardAdvancedAnalytics />
      </div>
    </Layout>
  );
}
