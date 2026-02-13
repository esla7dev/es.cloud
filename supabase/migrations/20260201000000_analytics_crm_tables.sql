/*
  # Analytics and CRM Tables

  1. New Tables
    - business_notes: Store notes/comments on businesses
    - business_tags: User-defined tags for categorization
    - business_result_tags: Many-to-many relationship between businesses and tags
    - tasks: Task management linked to interactions
    - interaction_status_history: Track all status changes for analytics

  2. Security
    - Enable RLS on all new tables
    - Add policies for user data isolation
*/

-- Create business_notes table
CREATE TABLE IF NOT EXISTS public.business_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_result_id uuid NOT NULL REFERENCES public.business_results(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  note text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create business_tags table
CREATE TABLE IF NOT EXISTS public.business_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create business_result_tags junction table
CREATE TABLE IF NOT EXISTS public.business_result_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_result_id uuid NOT NULL REFERENCES public.business_results(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.business_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_result_id, tag_id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  interaction_id uuid REFERENCES public.campaign_business_interactions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  completed boolean DEFAULT false,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create interaction_status_history table for analytics
CREATE TABLE IF NOT EXISTS public.interaction_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL REFERENCES public.campaign_business_interactions(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_at timestamptz DEFAULT now(),
  changed_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.business_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_result_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_status_history ENABLE ROW LEVEL SECURITY;

-- Business Notes Policies
DROP POLICY IF EXISTS "Users can read own business notes" ON public.business_notes;
CREATE POLICY "Users can read own business notes" ON public.business_notes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create business notes" ON public.business_notes;
CREATE POLICY "Users can create business notes" ON public.business_notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own business notes" ON public.business_notes;
CREATE POLICY "Users can update own business notes" ON public.business_notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own business notes" ON public.business_notes;
CREATE POLICY "Users can delete own business notes" ON public.business_notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Business Tags Policies
DROP POLICY IF EXISTS "Users can read own tags" ON public.business_tags;
CREATE POLICY "Users can read own tags" ON public.business_tags FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create tags" ON public.business_tags;
CREATE POLICY "Users can create tags" ON public.business_tags FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own tags" ON public.business_tags;
CREATE POLICY "Users can update own tags" ON public.business_tags FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own tags" ON public.business_tags;
CREATE POLICY "Users can delete own tags" ON public.business_tags FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Business Result Tags Policies
DROP POLICY IF EXISTS "Users can read business result tags" ON public.business_result_tags;
CREATE POLICY "Users can read business result tags" ON public.business_result_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_tags bt
      WHERE bt.id = tag_id AND bt.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create business result tags" ON public.business_result_tags;
CREATE POLICY "Users can create business result tags" ON public.business_result_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_tags bt
      WHERE bt.id = tag_id AND bt.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete business result tags" ON public.business_result_tags;
CREATE POLICY "Users can delete business result tags" ON public.business_result_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_tags bt
      WHERE bt.id = tag_id AND bt.user_id = auth.uid()
    )
  );

-- Tasks Policies
DROP POLICY IF EXISTS "Users can read own tasks" ON public.tasks;
CREATE POLICY "Users can read own tasks" ON public.tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Interaction Status History Policies
DROP POLICY IF EXISTS "Users can read interaction history from own campaigns" ON public.interaction_status_history;
CREATE POLICY "Users can read interaction history from own campaigns" ON public.interaction_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_business_interactions cbi
      JOIN public.campaigns c ON c.id = cbi.campaign_id
      WHERE cbi.id = interaction_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create interaction history" ON public.interaction_status_history;
CREATE POLICY "Users can create interaction history" ON public.interaction_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_business_interactions cbi
      JOIN public.campaigns c ON c.id = cbi.campaign_id
      WHERE cbi.id = interaction_id AND c.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_notes_business_result_id ON public.business_notes(business_result_id);
CREATE INDEX IF NOT EXISTS idx_business_notes_user_id ON public.business_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_business_result_tags_business_result_id ON public.business_result_tags(business_result_id);
CREATE INDEX IF NOT EXISTS idx_business_result_tags_tag_id ON public.business_result_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_interaction_id ON public.tasks(interaction_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_interaction_status_history_interaction_id ON public.interaction_status_history(interaction_id);
CREATE INDEX IF NOT EXISTS idx_interaction_status_history_changed_at ON public.interaction_status_history(changed_at);

-- Create view for campaign revenue analytics
CREATE OR REPLACE VIEW public.campaign_revenue_analytics AS
SELECT 
  c.id as campaign_id,
  c.user_id,
  c.name as campaign_name,
  c.created_at as campaign_created_at,
  COUNT(cbi.id) as total_interactions,
  COUNT(CASE WHEN cbi.status = 'client_acquired' THEN 1 END) as clients_acquired,
  COALESCE(SUM(cbi.mrr_value), 0) as total_mrr,
  COALESCE(SUM(cbi.one_time_deal_value), 0) as total_deals,
  COALESCE(AVG(cbi.mrr_value), 0) as avg_mrr,
  COALESCE(AVG(cbi.one_time_deal_value), 0) as avg_deal_value,
  ROUND(
    CAST(COUNT(CASE WHEN cbi.status = 'client_acquired' THEN 1 END) AS NUMERIC) / 
    NULLIF(COUNT(CASE WHEN cbi.status != 'not_contacted' THEN 1 END), 0) * 100, 
    2
  ) as conversion_rate
FROM public.campaigns c
LEFT JOIN public.campaign_business_interactions cbi ON cbi.campaign_id = c.id
GROUP BY c.id, c.user_id, c.name, c.created_at;

-- Create function to get user analytics for date range
CREATE OR REPLACE FUNCTION public.get_user_analytics(
  p_user_id uuid,
  p_date_from timestamptz DEFAULT now() - interval '30 days',
  p_date_to timestamptz DEFAULT now()
)
RETURNS TABLE (
  total_revenue numeric,
  total_mrr numeric,
  total_deals numeric,
  clients_acquired bigint,
  total_contacted bigint,
  conversion_rate numeric,
  avg_deal_size numeric,
  campaigns_count bigint,
  active_campaigns_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(cbi.mrr_value + cbi.one_time_deal_value), 0) as total_revenue,
    COALESCE(SUM(cbi.mrr_value), 0) as total_mrr,
    COALESCE(SUM(cbi.one_time_deal_value), 0) as total_deals,
    COUNT(CASE WHEN cbi.status = 'client_acquired' THEN 1 END) as clients_acquired,
    COUNT(CASE WHEN cbi.status != 'not_contacted' THEN 1 END) as total_contacted,
    ROUND(
      CAST(COUNT(CASE WHEN cbi.status = 'client_acquired' THEN 1 END) AS NUMERIC) / 
      NULLIF(COUNT(CASE WHEN cbi.status != 'not_contacted' THEN 1 END), 0) * 100, 
      2
    ) as conversion_rate,
    COALESCE(AVG(NULLIF(cbi.mrr_value + cbi.one_time_deal_value, 0)), 0) as avg_deal_size,
    COUNT(DISTINCT c.id) as campaigns_count,
    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_campaigns_count
  FROM public.campaigns c
  LEFT JOIN public.campaign_business_interactions cbi ON cbi.campaign_id = c.id
  WHERE c.user_id = p_user_id
    AND c.created_at BETWEEN p_date_from AND p_date_to;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
