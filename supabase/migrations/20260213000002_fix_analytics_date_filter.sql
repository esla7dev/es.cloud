/*
  # Fix analytics date filtering

  Changes the get_user_analytics RPC to filter by interaction updated_at
  instead of campaign created_at, so date ranges reflect when revenue was earned.
  
  Also updates the campaign_revenue_analytics view to include last_activity_at.
*/

-- Drop and recreate the analytics function with correct date filtering
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
    AND cbi.updated_at BETWEEN p_date_from AND p_date_to;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the view with last_activity_at column
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
  ) as conversion_rate,
  MAX(cbi.updated_at) as last_activity_at
FROM public.campaigns c
LEFT JOIN public.campaign_business_interactions cbi ON cbi.campaign_id = c.id
GROUP BY c.id, c.user_id, c.name, c.created_at;
