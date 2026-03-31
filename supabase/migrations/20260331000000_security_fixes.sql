/*
  # Security & data-integrity fixes

  1. add_user_credits — atomic RPC (single UPDATE, no read-then-write race condition)
  2. campaign_revenue_analytics view — filter to auth.uid() so no cross-user data leak
  3. get_user_analytics — fix NULL arithmetic COALESCE + add SET search_path
  4. get_revenue_by_product — fix NULL arithmetic COALESCE + add SET search_path
  5. Storage policies — restrict product-image upload/delete to owner role
  6. updated_at triggers — auto-maintain updated_at on campaigns, interactions, notes, tasks
  7. interaction_status_history.changed_by — auto-populate via trigger
*/

-- ============================================================
-- 1. Atomic add_user_credits function
--    Replaces the read-then-write pattern in the edge function.
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_user_credits(p_target_user_id uuid, p_amount integer)
RETURNS integer AS $$
DECLARE
  v_new_credits integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE public.profiles
  SET credits = credits + p_amount,
      updated_at = now()
  WHERE id = p_target_user_id
  RETURNING credits INTO v_new_credits;

  IF v_new_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN v_new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 2. campaign_revenue_analytics view — scoped to auth.uid()
--    PostgreSQL views bypass RLS by default; add the row filter
--    directly in the view definition so the isolation is in the DB.
-- ============================================================
CREATE OR REPLACE VIEW public.campaign_revenue_analytics AS
SELECT
  c.id                                                          AS campaign_id,
  c.user_id,
  c.name                                                        AS campaign_name,
  c.created_at                                                  AS campaign_created_at,
  COUNT(cbi.id)                                                 AS total_interactions,
  COUNT(CASE WHEN cbi.status = 'client_acquired' THEN 1 END)   AS clients_acquired,
  COALESCE(SUM(cbi.mrr_value), 0)                              AS total_mrr,
  COALESCE(SUM(cbi.one_time_deal_value), 0)                    AS total_deals,
  COALESCE(AVG(cbi.mrr_value), 0)                              AS avg_mrr,
  COALESCE(AVG(cbi.one_time_deal_value), 0)                    AS avg_deal_value,
  ROUND(
    CAST(COUNT(CASE WHEN cbi.status = 'client_acquired' THEN 1 END) AS NUMERIC) /
    NULLIF(COUNT(CASE WHEN cbi.status != 'not_contacted' THEN 1 END), 0) * 100,
    2
  )                                                             AS conversion_rate,
  MAX(cbi.updated_at)                                          AS last_activity_at
FROM public.campaigns c
LEFT JOIN public.campaign_business_interactions cbi ON cbi.campaign_id = c.id
WHERE c.user_id = auth.uid()
GROUP BY c.id, c.user_id, c.name, c.created_at;

-- ============================================================
-- 3. Fix get_user_analytics: COALESCE inner operands + search_path
-- ============================================================
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
    COALESCE(SUM(COALESCE(cbi.mrr_value, 0) + COALESCE(cbi.one_time_deal_value, 0)), 0) AS total_revenue,
    COALESCE(SUM(cbi.mrr_value), 0)                                                       AS total_mrr,
    COALESCE(SUM(cbi.one_time_deal_value), 0)                                             AS total_deals,
    COUNT(CASE WHEN cbi.status = 'client_acquired' THEN 1 END)                           AS clients_acquired,
    COUNT(CASE WHEN cbi.status != 'not_contacted' THEN 1 END)                            AS total_contacted,
    ROUND(
      CAST(COUNT(CASE WHEN cbi.status = 'client_acquired' THEN 1 END) AS NUMERIC) /
      NULLIF(COUNT(CASE WHEN cbi.status != 'not_contacted' THEN 1 END), 0) * 100,
      2
    )                                                                                      AS conversion_rate,
    COALESCE(AVG(
      NULLIF(COALESCE(cbi.mrr_value, 0) + COALESCE(cbi.one_time_deal_value, 0), 0)
    ), 0)                                                                                  AS avg_deal_size,
    COUNT(DISTINCT c.id)                                                                   AS campaigns_count,
    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END)                          AS active_campaigns_count
  FROM public.campaigns c
  LEFT JOIN public.campaign_business_interactions cbi ON cbi.campaign_id = c.id
  WHERE c.user_id = p_user_id
    AND cbi.updated_at BETWEEN p_date_from AND p_date_to;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 4. Fix get_revenue_by_product: COALESCE inner operands + search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_revenue_by_product(
  p_user_id uuid,
  p_date_from timestamptz DEFAULT now() - interval '30 days',
  p_date_to timestamptz DEFAULT now()
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  product_category text,
  product_type text,
  product_tier text,
  total_revenue numeric,
  total_mrr numeric,
  total_deals numeric,
  clients_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id                                                                                       AS product_id,
    p.name                                                                                     AS product_name,
    p.category                                                                                 AS product_category,
    p.type                                                                                     AS product_type,
    p.tier                                                                                     AS product_tier,
    COALESCE(SUM(COALESCE(cbi.mrr_value, 0) + COALESCE(cbi.one_time_deal_value, 0)), 0)      AS total_revenue,
    COALESCE(SUM(cbi.mrr_value), 0)                                                           AS total_mrr,
    COALESCE(SUM(cbi.one_time_deal_value), 0)                                                 AS total_deals,
    COUNT(CASE WHEN cbi.status = 'client_acquired' THEN 1 END)                               AS clients_count
  FROM public.campaign_business_interactions cbi
  JOIN public.campaigns c ON c.id = cbi.campaign_id
  JOIN public.products p ON p.id = cbi.product_id
  WHERE c.user_id = p_user_id
    AND cbi.updated_at BETWEEN p_date_from AND p_date_to
  GROUP BY p.id, p.name, p.category, p.type, p.tier
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 5. Storage policies — restrict product-image write access to owners
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own product images" ON storage.objects;

CREATE POLICY "Owners can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "Owners can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

-- ============================================================
-- 6. updated_at triggers — auto-maintain on key tables
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- campaigns
DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- campaign_business_interactions
DROP TRIGGER IF EXISTS trg_interactions_updated_at ON public.campaign_business_interactions;
CREATE TRIGGER trg_interactions_updated_at
  BEFORE UPDATE ON public.campaign_business_interactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- business_notes
DROP TRIGGER IF EXISTS trg_business_notes_updated_at ON public.business_notes;
CREATE TRIGGER trg_business_notes_updated_at
  BEFORE UPDATE ON public.business_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- tasks
DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 7. Auto-populate interaction_status_history.changed_by
--    Ensures the audit trail is never silently incomplete.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_interaction_changed_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.changed_by IS NULL THEN
    NEW.changed_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_interaction_history_changed_by ON public.interaction_status_history;
CREATE TRIGGER trg_interaction_history_changed_by
  BEFORE INSERT ON public.interaction_status_history
  FOR EACH ROW EXECUTE FUNCTION public.set_interaction_changed_by();
