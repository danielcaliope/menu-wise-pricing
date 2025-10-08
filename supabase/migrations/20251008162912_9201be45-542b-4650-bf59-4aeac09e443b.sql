-- Create function to check and create ingredient price alerts
CREATE OR REPLACE FUNCTION public.check_ingredient_price_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_config RECORD;
  price_change_pct NUMERIC;
BEGIN
  -- Only check if unit_cost changed
  IF NEW.unit_cost IS DISTINCT FROM OLD.unit_cost THEN
    -- Calculate percentage change
    price_change_pct := ((NEW.unit_cost - OLD.unit_cost) / OLD.unit_cost) * 100;
    
    -- Only proceed if price increased
    IF price_change_pct > 0 THEN
      -- Check if user has this alert enabled
      SELECT * INTO alert_config
      FROM public.cost_alerts
      WHERE user_id = NEW.user_id
        AND alert_type = 'ingredient_price_increase'
        AND enabled = true;
      
      -- If alert is enabled and threshold exceeded, create alert
      IF FOUND AND price_change_pct >= alert_config.threshold_percentage THEN
        INSERT INTO public.cost_alert_history (
          user_id,
          alert_type,
          reference_id,
          reference_name,
          old_value,
          new_value,
          percentage_change
        ) VALUES (
          NEW.user_id,
          'ingredient_price_increase',
          NEW.id,
          NEW.name,
          OLD.unit_cost,
          NEW.unit_cost,
          price_change_pct
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for ingredient price changes
DROP TRIGGER IF EXISTS trigger_ingredient_price_alert ON public.ingredients;
CREATE TRIGGER trigger_ingredient_price_alert
  AFTER UPDATE ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.check_ingredient_price_alert();

-- Create function to check recipe cost and margin alerts
CREATE OR REPLACE FUNCTION public.check_recipe_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_config RECORD;
  previous_pricing RECORD;
  cost_change_pct NUMERIC;
  margin_change_pct NUMERIC;
BEGIN
  -- Get previous pricing for this recipe
  SELECT * INTO previous_pricing
  FROM public.pricing_history
  WHERE user_id = NEW.user_id
    AND recipe_id = NEW.recipe_id
    AND id != NEW.id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Only check if there's a previous pricing to compare
  IF FOUND THEN
    -- Check recipe cost increase alert
    cost_change_pct := ((NEW.recipe_cost - previous_pricing.recipe_cost) / previous_pricing.recipe_cost) * 100;
    
    IF cost_change_pct > 0 THEN
      SELECT * INTO alert_config
      FROM public.cost_alerts
      WHERE user_id = NEW.user_id
        AND alert_type = 'recipe_cost_increase'
        AND enabled = true;
      
      IF FOUND AND cost_change_pct >= alert_config.threshold_percentage THEN
        INSERT INTO public.cost_alert_history (
          user_id,
          alert_type,
          reference_id,
          reference_name,
          old_value,
          new_value,
          percentage_change
        ) VALUES (
          NEW.user_id,
          'recipe_cost_increase',
          NEW.recipe_id,
          NEW.recipe_name,
          previous_pricing.recipe_cost,
          NEW.recipe_cost,
          cost_change_pct
        );
      END IF;
    END IF;
    
    -- Check margin drop alert
    margin_change_pct := NEW.profit_margin_percentage - previous_pricing.profit_margin_percentage;
    
    IF margin_change_pct < 0 THEN
      SELECT * INTO alert_config
      FROM public.cost_alerts
      WHERE user_id = NEW.user_id
        AND alert_type = 'margin_drop'
        AND enabled = true;
      
      IF FOUND AND ABS(margin_change_pct) >= alert_config.threshold_percentage THEN
        INSERT INTO public.cost_alert_history (
          user_id,
          alert_type,
          reference_id,
          reference_name,
          old_value,
          new_value,
          percentage_change
        ) VALUES (
          NEW.user_id,
          'margin_drop',
          NEW.recipe_id,
          NEW.recipe_name,
          previous_pricing.profit_margin_percentage,
          NEW.profit_margin_percentage,
          margin_change_pct
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for recipe pricing
DROP TRIGGER IF EXISTS trigger_recipe_alerts ON public.pricing_history;
CREATE TRIGGER trigger_recipe_alerts
  AFTER INSERT ON public.pricing_history
  FOR EACH ROW
  EXECUTE FUNCTION public.check_recipe_alerts();