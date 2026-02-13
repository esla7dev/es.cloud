/*
  # Add user role to profiles table

  1. New Types
    - `user_role` enum with values 'user' and 'owner'

  2. Schema Changes
    - Add `role` column to `profiles` table with default 'user'
    - Update existing users to have 'user' role

  3. Security
    - Enable RLS on `profiles` table (if not already enabled)
    - Add policies for owners to manage all profiles
    - Maintain existing user policies for self-management
*/

-- Create the user_role enum type
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'owner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add the role column to the profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN role public.user_role DEFAULT 'user' NOT NULL;
  END IF;
END $$;

-- Set existing users to 'user' role (important for existing data)
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL;

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can update any profile" ON public.profiles;

-- Create a function to check if current user is owner
-- This avoids the recursive policy issue
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'owner'
  );
$$;

-- Policy for SELECT: Owners can view all profiles using the function
CREATE POLICY "Owners can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_owner());

-- Policy for UPDATE: Owners can update any profile using the function
CREATE POLICY "Owners can update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());