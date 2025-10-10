-- Add new columns to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS with_delivery boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_price numeric;

-- Add foreign key to recipes
ALTER TABLE public.sales 
ADD CONSTRAINT sales_recipe_id_fkey 
FOREIGN KEY (recipe_id) 
REFERENCES public.recipes(id) 
ON DELETE CASCADE;