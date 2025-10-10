-- Create indirect_costs table for fixed monthly costs
CREATE TABLE public.indirect_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('fixed_monthly', 'variable')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recipe_indirect_costs table for costs specific to each recipe
CREATE TABLE public.recipe_indirect_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cost_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  cost_type TEXT NOT NULL CHECK (cost_type IN ('packaging', 'labor', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.indirect_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_indirect_costs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for indirect_costs
CREATE POLICY "Users can view own indirect costs"
  ON public.indirect_costs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own indirect costs"
  ON public.indirect_costs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own indirect costs"
  ON public.indirect_costs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own indirect costs"
  ON public.indirect_costs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for recipe_indirect_costs
CREATE POLICY "Users can view own recipe indirect costs"
  ON public.recipe_indirect_costs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recipe indirect costs"
  ON public.recipe_indirect_costs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipe indirect costs"
  ON public.recipe_indirect_costs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipe indirect costs"
  ON public.recipe_indirect_costs FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on indirect_costs
CREATE TRIGGER update_indirect_costs_updated_at
  BEFORE UPDATE ON public.indirect_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();