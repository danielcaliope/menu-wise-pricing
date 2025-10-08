-- Adicionar campo de porções padrão na tabela de receitas
ALTER TABLE public.recipes
ADD COLUMN default_servings integer DEFAULT 1 NOT NULL CHECK (default_servings > 0);