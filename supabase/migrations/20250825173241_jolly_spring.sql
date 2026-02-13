/*
  # Add user profile fields

  1. New Columns
    - `company_name` (text, nullable) - User's company name
    - `sender_name` (text, nullable) - User's personal/sender name
    - `phone` (text, nullable) - User's phone number
    - `address` (text, nullable) - User's business address
    - `website` (text, nullable) - User's website URL

  2. Security
    - Maintain existing RLS policies
    - Add indexes for better performance
*/

-- Add new profile fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS sender_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS website text;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON profiles(company_name);

-- Update the trigger function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();