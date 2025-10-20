-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create regional_factors table to store pricing multipliers by state
CREATE TABLE IF NOT EXISTS public.regional_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_code TEXT NOT NULL UNIQUE,
  state_name TEXT NOT NULL,
  factor DECIMAL(5,4) NOT NULL DEFAULT 1.0000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regional_factors ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view regional factors (public data)
CREATE POLICY "Regional factors are viewable by everyone"
ON public.regional_factors
FOR SELECT
USING (true);

-- Policy: Only authenticated users can insert regional factors (admin feature)
CREATE POLICY "Authenticated users can insert regional factors"
ON public.regional_factors
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Only authenticated users can update regional factors
CREATE POLICY "Authenticated users can update regional factors"
ON public.regional_factors
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Only authenticated users can delete regional factors
CREATE POLICY "Authenticated users can delete regional factors"
ON public.regional_factors
FOR DELETE
TO authenticated
USING (true);

-- Insert default regional factors for Brazilian states
INSERT INTO public.regional_factors (state_code, state_name, factor) VALUES
('AC', 'Acre', 1.1500),
('AL', 'Alagoas', 1.0800),
('AP', 'Amapá', 1.2000),
('AM', 'Amazonas', 1.1800),
('BA', 'Bahia', 1.0500),
('CE', 'Ceará', 1.0600),
('DF', 'Distrito Federal', 1.1200),
('ES', 'Espírito Santo', 1.0300),
('GO', 'Goiás', 1.0400),
('MA', 'Maranhão', 1.0900),
('MT', 'Mato Grosso', 1.0700),
('MS', 'Mato Grosso do Sul', 1.0600),
('MG', 'Minas Gerais', 1.0200),
('PA', 'Pará', 1.1000),
('PB', 'Paraíba', 1.0700),
('PR', 'Paraná', 1.0100),
('PE', 'Pernambuco', 1.0600),
('PI', 'Piauí', 1.0800),
('RJ', 'Rio de Janeiro', 1.0500),
('RN', 'Rio Grande do Norte', 1.0700),
('RS', 'Rio Grande do Sul', 1.0000),
('RO', 'Rondônia', 1.1300),
('RR', 'Roraima', 1.2200),
('SC', 'Santa Catarina', 1.0100),
('SP', 'São Paulo', 1.0000),
('SE', 'Sergipe', 1.0800),
('TO', 'Tocantins', 1.0900)
ON CONFLICT (state_code) DO NOTHING;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_regional_factors_updated_at
BEFORE UPDATE ON public.regional_factors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();