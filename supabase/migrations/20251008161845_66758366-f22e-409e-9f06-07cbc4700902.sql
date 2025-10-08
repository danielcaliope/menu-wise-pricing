-- Fix cost_alerts unique constraint for upsert to work
ALTER TABLE public.cost_alerts 
ADD CONSTRAINT cost_alerts_user_id_alert_type_unique UNIQUE (user_id, alert_type);

-- Create competitive analysis table
CREATE TABLE public.competitive_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  competitor_name TEXT NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  competitor_price NUMERIC NOT NULL,
  our_price NUMERIC NOT NULL,
  price_difference_percentage NUMERIC NOT NULL,
  market_position TEXT CHECK (market_position IN ('cheaper', 'similar', 'premium')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competitive_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own competitive analysis"
  ON public.competitive_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own competitive analysis"
  ON public.competitive_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own competitive analysis"
  ON public.competitive_analysis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own competitive analysis"
  ON public.competitive_analysis FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_competitive_analysis_updated_at
  BEFORE UPDATE ON public.competitive_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX idx_competitive_analysis_user_id ON public.competitive_analysis(user_id);
CREATE INDEX idx_competitive_analysis_recipe_id ON public.competitive_analysis(recipe_id);