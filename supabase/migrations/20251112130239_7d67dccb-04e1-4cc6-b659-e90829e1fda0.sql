-- Create table for mapping iFood products to recipes
CREATE TABLE public.ifood_product_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  recipe_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_name)
);

-- Enable RLS
ALTER TABLE public.ifood_product_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own mappings" 
ON public.ifood_product_mappings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mappings" 
ON public.ifood_product_mappings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mappings" 
ON public.ifood_product_mappings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mappings" 
ON public.ifood_product_mappings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ifood_product_mappings_updated_at
BEFORE UPDATE ON public.ifood_product_mappings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();