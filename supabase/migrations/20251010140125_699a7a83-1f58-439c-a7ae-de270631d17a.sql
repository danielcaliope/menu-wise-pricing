-- Create sales table
CREATE TABLE public.sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  recipe_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  cost_per_unit numeric NOT NULL,
  total_cost numeric NOT NULL,
  profit numeric NOT NULL,
  sale_date timestamp with time zone NOT NULL DEFAULT now(),
  customer_name text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own sales"
  ON public.sales
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sales"
  ON public.sales
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales"
  ON public.sales
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales"
  ON public.sales
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();