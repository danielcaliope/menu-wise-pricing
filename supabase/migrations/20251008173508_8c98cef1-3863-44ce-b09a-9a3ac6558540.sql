-- Add delivery fee percentage to pricing configs
ALTER TABLE public.pricing_configs
ADD COLUMN delivery_fee_percentage numeric DEFAULT 0;

-- Add delivery fee fields to pricing history
ALTER TABLE public.pricing_history
ADD COLUMN delivery_fee_percentage numeric DEFAULT 0,
ADD COLUMN price_without_delivery numeric,
ADD COLUMN price_with_delivery numeric;

-- Update existing pricing_history records to set price_without_delivery to current suggested_price
UPDATE public.pricing_history
SET price_without_delivery = suggested_price,
    price_with_delivery = suggested_price
WHERE price_without_delivery IS NULL;