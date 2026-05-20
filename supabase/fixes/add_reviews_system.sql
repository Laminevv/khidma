-- ─────────────────────────────────────────────────────────────
-- FIX: ADD REVIEWS & RATING SYSTEM
-- Run this file in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Create the reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure a user can only review a specific contract once
  CONSTRAINT uq_contract_reviewer UNIQUE(contract_id, reviewer_id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT 
USING (true);

-- Users can insert their own reviews
CREATE POLICY "Users can insert their own reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);

-- 3. Create Trigger Function to automatically update profiles.rating and total_reviews
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reviewee_id UUID;
  v_avg_rating NUMERIC(3, 2);
  v_total_reviews INT;
BEGIN
  -- Determine the reviewee_id based on the operation
  IF TG_OP = 'DELETE' THEN
    v_reviewee_id := OLD.reviewee_id;
  ELSE
    v_reviewee_id := NEW.reviewee_id;
  END IF;

  -- Calculate new stats for the reviewee
  SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0.00), COUNT(*)
    INTO v_avg_rating, v_total_reviews
    FROM public.reviews
   WHERE reviewee_id = v_reviewee_id;

  -- Update the profiles table
  UPDATE public.profiles
     SET rating = v_avg_rating,
         total_reviews = v_total_reviews
   WHERE id = v_reviewee_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Attach Trigger to reviews table
DROP TRIGGER IF EXISTS tr_update_user_rating ON public.reviews;
CREATE TRIGGER tr_update_user_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_user_rating();

-- ─────────────────────────────────────────────────────────────
-- END OF SCRIPT
-- ─────────────────────────────────────────────────────────────
