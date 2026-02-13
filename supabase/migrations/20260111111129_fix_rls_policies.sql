/*
  # Fix RLS Policies - Correct Syntax

  Fix the UPDATE policies syntax error
*/

-- Profiles Policies - Update policies with correct syntax
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Searches Policies
DROP POLICY IF EXISTS "Users can read own searches" ON public.searches;
CREATE POLICY "Users can read own searches" ON public.searches
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create searches" ON public.searches;
CREATE POLICY "Users can create searches" ON public.searches
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own searches" ON public.searches;
CREATE POLICY "Users can delete own searches" ON public.searches
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Business Results Policies
DROP POLICY IF EXISTS "Users can read business results from own searches" ON public.business_results;
CREATE POLICY "Users can read business results from own searches" ON public.business_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.searches
      WHERE id = search_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert business results" ON public.business_results;
CREATE POLICY "Users can insert business results" ON public.business_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.searches
      WHERE id = search_id AND user_id = auth.uid()
    )
  );

-- Message Templates Policies
DROP POLICY IF EXISTS "Users can read own templates" ON public.message_templates;
CREATE POLICY "Users can read own templates" ON public.message_templates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create templates" ON public.message_templates;
CREATE POLICY "Users can create templates" ON public.message_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own templates" ON public.message_templates;
CREATE POLICY "Users can update own templates" ON public.message_templates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own templates" ON public.message_templates;
CREATE POLICY "Users can delete own templates" ON public.message_templates
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Products Policies
DROP POLICY IF EXISTS "Everyone can read products" ON public.products;
CREATE POLICY "Everyone can read products" ON public.products
  FOR SELECT
  USING (true);