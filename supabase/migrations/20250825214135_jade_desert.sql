/*
  # Add user role system to profiles

  1. New Types
    - `user_role` enum with values 'user' and 'owner'
  
  2. Changes to profiles table
    - Add `role` column with default 'user'
    - Update existing users to have 'user' role
  
  3. Security
    - Add RLS policies for owners to view and update all profiles
    - Owners can view all profiles
    - Owners can update any profile
*/

-- Create the user_role enum type
CREATE TYPE public.user_role AS ENUM ('user', 'owner');

-- Add the role column to the profiles table
ALTER TABLE public.profiles
ADD COLUMN role public.user_role DEFAULT 'user' NOT NULL;

-- Set existing users to 'user' role (important for existing data)
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL;

-- Add RLS policies for owners to view and update all profiles
-- These policies are PERMISSIVE and will combine with existing user-specific policies

-- Policy for SELECT: Owners can view all profiles
CREATE POLICY "Owners can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
);

-- Policy for UPDATE: Owners can update any profile
CREATE POLICY "Owners can update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
) WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
);