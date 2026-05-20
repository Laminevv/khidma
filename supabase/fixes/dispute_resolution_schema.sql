-- ─────────────────────────────────────────────────────────────
-- FIX: DISPUTE RESOLUTION CENTER
-- Run this file in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Create dispute_messages table for 3-way chat
CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Select (Parties + Admins)
CREATE POLICY "dispute_messages_select" ON public.dispute_messages FOR SELECT USING (
  auth.uid() IN (
    SELECT c.client_id FROM public.contracts c JOIN public.disputes d ON c.id = d.contract_id WHERE d.id = dispute_messages.dispute_id
    UNION
    SELECT c.freelancer_id FROM public.contracts c JOIN public.disputes d ON c.id = d.contract_id WHERE d.id = dispute_messages.dispute_id
  )
  OR
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
);

-- Policy: Insert (Parties + Admins)
CREATE POLICY "dispute_messages_insert" ON public.dispute_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  (
    auth.uid() IN (
      SELECT c.client_id FROM public.contracts c JOIN public.disputes d ON c.id = d.contract_id WHERE d.id = dispute_messages.dispute_id
      UNION
      SELECT c.freelancer_id FROM public.contracts c JOIN public.disputes d ON c.id = d.contract_id WHERE d.id = dispute_messages.dispute_id
    )
    OR
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = TRUE
  )
);

-- 2. Create RPC for secure escrow splitting by Admins
CREATE OR REPLACE FUNCTION public.resolve_dispute_escrow(
  p_dispute_id UUID,
  p_locked_amount NUMERIC,
  p_client_pct NUMERIC,
  p_freelancer_pct NUMERIC,
  p_resolution TEXT,
  p_admin_id UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_dispute public.disputes%ROWTYPE;
  v_contract public.contracts%ROWTYPE;
  v_client_refund NUMERIC;
  v_freelancer_release NUMERIC;
  v_fee NUMERIC;
BEGIN
  -- Validate percentages
  IF (p_client_pct + p_freelancer_pct) != 100 THEN
    RAISE EXCEPTION 'Percentages must sum to 100';
  END IF;

  SELECT * INTO v_dispute FROM public.disputes WHERE id = p_dispute_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dispute not found'; END IF;
  IF v_dispute.status = 'closed' THEN RAISE EXCEPTION 'Dispute is already resolved'; END IF;

  SELECT * INTO v_contract FROM public.contracts WHERE id = v_dispute.contract_id;

  -- Calculate splits
  v_client_refund := ROUND((p_locked_amount * p_client_pct) / 100.0, 2);
  v_freelancer_release := p_locked_amount - v_client_refund;

  -- Refund client to deposit_balance
  IF v_client_refund > 0 THEN
    UPDATE public.profiles SET deposit_balance = deposit_balance + v_client_refund WHERE id = v_contract.client_id;
    INSERT INTO public.transactions (contract_id, from_user_id, to_user_id, amount, type, status, note)
    VALUES (v_contract.id, v_contract.client_id, v_contract.client_id, v_client_refund, 'refund', 'completed', 'استرجاع من النزاع');
  END IF;

  -- Release to freelancer (minus 10% platform fee)
  IF v_freelancer_release > 0 THEN
    v_fee := ROUND(v_freelancer_release * 0.10, 2);
    UPDATE public.profiles SET withdrawable_balance = withdrawable_balance + (v_freelancer_release - v_fee) WHERE id = v_contract.freelancer_id;
    INSERT INTO public.transactions (contract_id, from_user_id, to_user_id, amount, fee, type, status, note)
    VALUES (v_contract.id, v_contract.client_id, v_contract.freelancer_id, v_freelancer_release, v_fee, 'escrow_release', 'completed', 'تسوية النزاع');
  END IF;

  -- Update dispute status
  UPDATE public.disputes
  SET status = 'closed',
      resolution = p_resolution,
      resolved_at = NOW()
  WHERE id = p_dispute_id;
  
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- END OF SCRIPT
-- ─────────────────────────────────────────────────────────────
