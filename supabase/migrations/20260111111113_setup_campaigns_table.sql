/*
  # Setup Campaigns and Interactions Tables

  1. Create campaigns table
  2. Create campaign_business_interactions table
  3. Add RLS policies
*/

-- Create campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  name text NOT NULL,
  search_id uuid NOT NULL REFERENCES public.searches(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  progress integer DEFAULT 0,
  total_businesses integer DEFAULT 0,
  websites_extracted integer DEFAULT 0,
  phones_extracted integer DEFAULT 0,
  contacted_businesses integer DEFAULT 0,
  target_country_code text DEFAULT '966',
  default_offer_template_id uuid,
  default_follow_up_template_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaign_business_interactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.campaign_business_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  business_result_id uuid NOT NULL REFERENCES public.business_results(id),
  status text NOT NULL DEFAULT 'not_contacted' CHECK (status IN ('not_contacted', 'sent', 'in_progress', 'client_acquired', 'lost_rejected')),
  last_action text,
  last_action_at timestamptz,
  mrr_value numeric,
  one_time_deal_value numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_business_interactions ENABLE ROW LEVEL SECURITY;

-- Campaigns Policies
DROP POLICY IF EXISTS "Users can read own campaigns" ON public.campaigns;
CREATE POLICY "Users can read own campaigns" ON public.campaigns FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
CREATE POLICY "Users can create campaigns" ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
CREATE POLICY "Users can update own campaigns" ON public.campaigns FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.campaigns;
CREATE POLICY "Users can delete own campaigns" ON public.campaigns FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Campaign Business Interactions Policies
DROP POLICY IF EXISTS "Users can read interactions from own campaigns" ON public.campaign_business_interactions;
CREATE POLICY "Users can read interactions from own campaigns" ON public.campaign_business_interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create interactions in own campaigns" ON public.campaign_business_interactions;
CREATE POLICY "Users can create interactions in own campaigns" ON public.campaign_business_interactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update interactions in own campaigns" ON public.campaign_business_interactions;
CREATE POLICY "Users can update interactions in own campaigns" ON public.campaign_business_interactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete interactions in own campaigns" ON public.campaign_business_interactions;
CREATE POLICY "Users can delete interactions in own campaigns" ON public.campaign_business_interactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND user_id = auth.uid()
    )
  );