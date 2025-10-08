-- Criar tabela de estoque atual
CREATE TABLE public.ingredient_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  current_quantity NUMERIC NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  min_quantity NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ingredient_id)
);

-- Criar tabela de movimentações de estoque
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste')),
  quantity NUMERIC NOT NULL,
  previous_quantity NUMERIC NOT NULL,
  new_quantity NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ingredient_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies para ingredient_stock
CREATE POLICY "Users can view own stock"
  ON public.ingredient_stock FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock"
  ON public.ingredient_stock FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stock"
  ON public.ingredient_stock FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock"
  ON public.ingredient_stock FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies para stock_movements
CREATE POLICY "Users can view own movements"
  ON public.stock_movements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX idx_ingredient_stock_user_id ON public.ingredient_stock(user_id);
CREATE INDEX idx_ingredient_stock_ingredient_id ON public.ingredient_stock(ingredient_id);
CREATE INDEX idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX idx_stock_movements_ingredient_id ON public.stock_movements(ingredient_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);