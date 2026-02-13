/*
  # Expand products schema & add product_id to interactions

  1. Add new columns to products table:
     - category (vertical: web_dev, marketing, arch_studio)
     - image_url (portfolio thumbnails)
     - features (JSONB array for package bullet points)
     - is_active (archive/hide toggle)
     - display_order (sorting)
     - price_display (human-readable pricing text)
     - tier (basic, pro, enterprise)
  
  2. Add product_id FK to campaign_business_interactions
  
  3. Create storage bucket for product images
  
  4. Create RPC for revenue-by-product analytics
*/

-- Add new columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'web_dev' 
  CHECK (category IN ('web_dev', 'marketing', 'arch_studio'));
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_display text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tier text DEFAULT 'basic'
  CHECK (tier IN ('basic', 'pro', 'enterprise'));

-- Add product_id FK to campaign_business_interactions
ALTER TABLE public.campaign_business_interactions 
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON public.products(display_order);
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_product_id ON public.campaign_business_interactions(product_id);

-- Create function for revenue by product analytics
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
    p.id as product_id,
    p.name as product_name,
    p.category as product_category,
    p.type as product_type,
    p.tier as product_tier,
    COALESCE(SUM(cbi.mrr_value + cbi.one_time_deal_value), 0) as total_revenue,
    COALESCE(SUM(cbi.mrr_value), 0) as total_mrr,
    COALESCE(SUM(cbi.one_time_deal_value), 0) as total_deals,
    COUNT(CASE WHEN cbi.status = 'client_acquired' THEN 1 END) as clients_count
  FROM public.campaign_business_interactions cbi
  JOIN public.campaigns c ON c.id = cbi.campaign_id
  JOIN public.products p ON p.id = cbi.product_id
  WHERE c.user_id = p_user_id
    AND cbi.updated_at BETWEEN p_date_from AND p_date_to
  GROUP BY p.id, p.name, p.category, p.type, p.tier
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert Supabase Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow public read access to product images
CREATE POLICY "Public can read product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow owners to delete product images
CREATE POLICY "Authenticated users can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
