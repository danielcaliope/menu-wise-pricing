-- Tabela para armazenar configurações da integração iFood
CREATE TABLE public.ifood_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  merchant_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela para armazenar pedidos do iFood
CREATE TABLE public.ifood_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ifood_order_id text NOT NULL,
  merchant_id text NOT NULL,
  order_type text NOT NULL,
  order_timing text,
  delivery_address jsonb,
  customer jsonb NOT NULL,
  items jsonb NOT NULL,
  total_amount numeric NOT NULL,
  sub_total numeric NOT NULL,
  delivery_fee numeric,
  benefits jsonb,
  payments jsonb NOT NULL,
  order_status text NOT NULL DEFAULT 'PLACED',
  created_at_ifood timestamp with time zone NOT NULL,
  synced_to_sales boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ifood_order_id)
);

-- Enable RLS
ALTER TABLE public.ifood_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifood_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ifood_config
CREATE POLICY "Users can view own ifood config"
  ON public.ifood_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ifood config"
  ON public.ifood_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ifood config"
  ON public.ifood_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ifood config"
  ON public.ifood_config FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ifood_orders
CREATE POLICY "Users can view own ifood orders"
  ON public.ifood_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ifood orders"
  ON public.ifood_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ifood orders"
  ON public.ifood_orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_ifood_config_updated_at
  BEFORE UPDATE ON public.ifood_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ifood_orders_updated_at
  BEFORE UPDATE ON public.ifood_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();