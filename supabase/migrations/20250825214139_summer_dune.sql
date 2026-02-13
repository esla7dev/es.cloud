/*
  # Create products table for owner-managed products

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, product name)
      - `description` (text, optional description)
      - `price_credits` (integer, cost in credits)
      - `type` (text, product type/category)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, foreign key to profiles)

  2. Security
    - Enable RLS on products table
    - All authenticated users can view products
    - Only owners can create, update, and delete products

  3. Triggers
    - Auto-update updated_at column on changes
*/

CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    price_credits integer NOT NULL DEFAULT 0,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Add index for better query performance
CREATE INDEX idx_products_type ON public.products(type);
CREATE INDEX idx_products_created_by ON public.products(created_by);

-- Add a trigger to update the updated_at column automatically
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on the products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products table

-- All authenticated users can view products
CREATE POLICY "All authenticated users can view products" ON public.products
FOR SELECT TO authenticated
USING (true);

-- Only Owners can create products
CREATE POLICY "Owners can create products" ON public.products
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
);

-- Only Owners can update products
CREATE POLICY "Owners can update products" ON public.products
FOR UPDATE TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
) WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
);

-- Only Owners can delete products
CREATE POLICY "Owners can delete products" ON public.products
FOR DELETE TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
);