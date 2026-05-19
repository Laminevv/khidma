-- ============================================================
--  Security Fixes — SQL Script
--  Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--  These two functions are REQUIRED for the security fixes to work.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- FIX for BUG-02: confirm_manual_deposit
--
-- Replaces the two-step read-then-write balance update in
-- confirmDepositAction. Everything happens in one atomic
-- PostgreSQL transaction with a SELECT FOR UPDATE lock to
-- prevent race conditions when multiple deposits are confirmed.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.confirm_manual_deposit(
  p_transaction_id UUID,
  p_admin_id       UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_amount  NUMERIC;
  v_status  TEXT;
BEGIN
  -- Lock the transaction row to prevent concurrent confirmations
  SELECT from_user_id, amount, status
    INTO v_user_id, v_amount, v_status
    FROM public.transactions
   WHERE id = p_transaction_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
  END IF;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Transaction is not pending (current status: %)', v_status;
  END IF;

  -- Atomically credit the user's wallet balance
  UPDATE public.profiles
     SET balance = balance + v_amount
   WHERE id = v_user_id;

  -- Mark the transaction as completed, recording which admin confirmed it
  UPDATE public.transactions
     SET status   = 'completed',
         note     = 'تم تأكيد الإيداع',
         metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object(
                      'resolved_by', p_admin_id::TEXT,
                      'resolved_at', NOW()::TEXT
                    )
   WHERE id = p_transaction_id;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- FIX for BUG-10: updated request_deposit
--
-- Adds an optional p_metadata JSONB parameter so that
-- sender_name and sender_account are written in the same
-- INSERT as the transaction — no second round-trip that could
-- fail silently after the row is already created.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_deposit(
  p_user_id     UUID,
  p_amount      NUMERIC,
  p_method      TEXT,
  p_receipt_url TEXT    DEFAULT NULL,
  p_metadata    JSONB   DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Validate amount
  IF p_amount < 1000 THEN
    RAISE EXCEPTION 'المبلغ الأدنى للإيداع هو 1000 دج';
  END IF;

  -- Validate method
  IF p_method NOT IN ('ccp', 'baridimob', 'edahabia') THEN
    RAISE EXCEPTION 'طريقة الدفع غير صالحة';
  END IF;

  -- Require receipt for manual methods
  IF p_method IN ('ccp', 'baridimob') AND p_receipt_url IS NULL THEN
    RAISE EXCEPTION 'يجب رفع إيصال الدفع لهذه الطريقة';
  END IF;

  INSERT INTO public.transactions (
    from_user_id,
    amount,
    type,
    status,
    payment_method,
    receipt_url,
    note,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    'deposit',
    'pending',
    p_method,
    p_receipt_url,
    'طلب إيداع — بانتظار التأكيد',
    COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
