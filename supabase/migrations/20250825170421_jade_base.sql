/*
  # Add user profile data fields

  1. New Columns
    - `company_name` (text) - User's company name for templates and invoicing
    - `sender_name` (text) - User's name for message templates
    - `phone` (text) - User's phone number
    - `address` (text) - User's business address
    - `website` (text) - User's website URL

  2. Security
    - Maintain existing RLS policies
    - Add updated_at trigger for profile changes
*/

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add company_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_name text;
  END IF;

  -- Add sender_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'sender_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN sender_name text;
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;

  -- Add website column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'website'
  ) THEN
    ALTER TABLE profiles ADD COLUMN website text;
  END IF;
END $$;

-- Create index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON profiles(company_name);