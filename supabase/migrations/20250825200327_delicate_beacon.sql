/*
  # Update default credits to 50 for new users

  1. Changes
    - Update the default value for the `credits` column in the `profiles` table from 100 to 50
    - This ensures all new users automatically receive 50 credits instead of 100

  2. Security
    - No changes to RLS policies or permissions
    - Only modifies the default value for new records
*/

-- Update the default value for credits column to 50
ALTER TABLE profiles ALTER COLUMN credits SET DEFAULT 50;