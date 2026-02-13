/*
  # Fix deduct_credits RPC with row-level locking

  Restores the FOR UPDATE row-level locking that was lost in the previous migration.
  Also raises an exception on insufficient credits instead of silently returning false.
*/

DROP FUNCTION IF EXISTS public.deduct_credits(uuid, integer);

CREATE OR REPLACE FUNCTION public.deduct_credits(user_id uuid, amount integer)
RETURNS boolean AS $$
DECLARE
  current_credits integer;
BEGIN
  -- Lock the row to prevent concurrent credit deductions
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = user_id
  FOR UPDATE;
  
  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;
  
  IF current_credits < amount THEN
    RAISE EXCEPTION 'رصيدك غير كافي. الرصيد الحالي: % , المطلوب: %', current_credits, amount;
  END IF;
  
  UPDATE public.profiles
  SET credits = credits - amount,
      updated_at = now()
  WHERE id = user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
