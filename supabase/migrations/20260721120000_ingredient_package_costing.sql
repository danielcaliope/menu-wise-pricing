-- Etapa 3: campos para o fluxo guiado de custo de ingrediente (embalagem/preço/perda)
-- Nullable: linhas existentes não são afetadas, formulário de edição usa modo legado
-- quando package_quantity for NULL.
ALTER TABLE public.ingredients
  ADD COLUMN package_quantity NUMERIC CHECK (package_quantity IS NULL OR package_quantity > 0),
  ADD COLUMN package_price NUMERIC CHECK (package_price IS NULL OR package_price >= 0),
  ADD COLUMN waste_percentage NUMERIC NOT NULL DEFAULT 0 CHECK (waste_percentage >= 0 AND waste_percentage < 100);

-- DECIMAL(10,2) arredonda custo por grama/ml (frequentemente sub-centavo) para 0 ou para
-- cima. Upcast para NUMERIC é sem perda para os valores já existentes.
ALTER TABLE public.ingredients
  ALTER COLUMN unit_cost TYPE NUMERIC;
