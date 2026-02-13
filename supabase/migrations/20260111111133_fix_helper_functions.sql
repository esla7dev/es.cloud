/*
  # Setup Helper Functions - Fixed

  1. deduct_credits: RPC function for deducting credits on search
  2. Create indexes for performance
*/

-- Drop existing function first
DROP FUNCTION IF EXISTS public.deduct_credits(uuid, integer);

-- Function to deduct credits
CREATE OR REPLACE FUNCTION public.deduct_credits(user_id uuid, amount integer)
RETURNS boolean AS $$
DECLARE
  current_credits integer;
BEGIN
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = user_id;
  
  IF current_credits < amount THEN
    RETURN false;
  END IF;
  
  UPDATE public.profiles
  SET credits = credits - amount,
      updated_at = now()
  WHERE id = user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON public.searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON public.searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_results_search_id ON public.business_results(search_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_campaign_id ON public.campaign_business_interactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON public.message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);