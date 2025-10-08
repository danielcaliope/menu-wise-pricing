-- Create pricing_history table to store generated pricing calculations
CREATE TABLE IF NOT EXISTS public.pricing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL,
  recipe_name TEXT NOT NULL,
  recipe_cost NUMERIC NOT NULL,
  profit_margin_percentage NUMERIC NOT NULL,
  tax_percentage NUMERIC NOT NULL,
  regional_factor NUMERIC NOT NULL,
  suggested_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own pricing history" 
ON public.pricing_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pricing history" 
ON public.pricing_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pricing history" 
ON public.pricing_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_pricing_history_user_id ON public.pricing_history(user_id);
CREATE INDEX idx_pricing_history_created_at ON public.pricing_history(created_at DESC);