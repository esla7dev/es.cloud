/*
  # Create deduct_credits function

  1. New Functions
    - `deduct_credits(user_id uuid, amount integer)`
      - Deducts the specified amount from user's credits
      - Prevents deduction if insufficient credits
      - Returns the updated credits balance
  
  2. Security
    - Function uses SECURITY DEFINER to run with elevated privileges
    - Includes validation to prevent negative credits
    - Raises exception if insufficient credits
*/

CREATE OR REPLACE FUNCTION public.deduct_credits(
  user_id uuid,
  amount integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits integer;
  new_credits integer;
BEGIN
  -- Validate input
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Get current credits with row lock
  SELECT credits INTO current_credits
  FROM profiles
  WHERE id = user_id
  FOR UPDATE;

  -- Check if user exists
  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if user has sufficient credits
  IF current_credits < amount THEN
    RAISE EXCEPTION 'Insufficient credits. Current: %, Required: %', current_credits, amount;
  END IF;

  -- Calculate new credits
  new_credits := current_credits - amount;

  -- Update credits
  UPDATE profiles
  SET credits = new_credits,
      updated_at = now()
  WHERE id = user_id;

  -- Return new credits balance
  RETURN new_credits;
END;
$$;