/*
  # Fix Profiles Table RLS Policies

  1. Security Updates
    - Drop existing restrictive policies on profiles table
    - Create proper INSERT policy for authenticated users to create their own profile
    - Create proper SELECT policy for authenticated users to read their own profile
    - Create proper UPDATE policy for authenticated users to update their own profile

  2. Changes
    - Allow authenticated users to insert their own profile record
    - Allow authenticated users to select their own profile record
    - Allow authenticated users to update their own profile record
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create comprehensive RLS policies for profiles table
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;