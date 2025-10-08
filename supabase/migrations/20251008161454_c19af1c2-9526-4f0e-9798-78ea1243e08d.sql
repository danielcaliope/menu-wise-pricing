-- Create cost alerts table
CREATE TABLE public.cost_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('ingredient_price_increase', 'recipe_cost_increase', 'margin_drop')),
  threshold_percentage NUMERIC NOT NULL DEFAULT 10,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cost alert history table
CREATE TABLE public.cost_alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  reference_name TEXT NOT NULL,
  old_value NUMERIC NOT NULL,
  new_value NUMERIC NOT NULL,
  percentage_change NUMERIC NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.cost_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cost_alerts
CREATE POLICY "Users can view own alerts"
  ON public.cost_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
  ON public.cost_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.cost_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON public.cost_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for cost_alert_history
CREATE POLICY "Users can view own alert history"
  ON public.cost_alert_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alert history"
  ON public.cost_alert_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert history"
  ON public.cost_alert_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_cost_alerts_updated_at
  BEFORE UPDATE ON public.cost_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX idx_cost_alerts_user_id ON public.cost_alerts(user_id);
CREATE INDEX idx_cost_alert_history_user_id ON public.cost_alert_history(user_id);
CREATE INDEX idx_cost_alert_history_triggered_at ON public.cost_alert_history(triggered_at DESC);