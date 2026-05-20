-- ============================================================
--  Khidma.dz — Dual Balance Migration Script
--  Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Modify Profiles Table
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles 
  RENAME COLUMN balance TO deposit_balance;

ALTER TABLE public.profiles 
  ADD COLUMN withdrawable_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- ─────────────────────────────────────────────────────────────
-- 2. Update deposit RPCs to use deposit_balance
-- ─────────────────────────────────────────────────────────────

-- Admin manual deposit confirmation
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
  SELECT to_user_id, amount, status
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

  -- Atomically credit the user's deposit balance
  UPDATE public.profiles
     SET deposit_balance = deposit_balance + v_amount
   WHERE id = v_user_id;

  -- Mark the transaction as completed
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

-- Webhook deposit processing
CREATE OR REPLACE FUNCTION public.process_deposit(
  p_user_id       UUID,
  p_amount        NUMERIC,
  p_reference     TEXT
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_txn_id UUID;
BEGIN
  -- Credit user deposit wallet
  UPDATE public.profiles
  SET deposit_balance = deposit_balance + p_amount
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for deposit';
  END IF;

  -- Insert completed deposit transaction
  INSERT INTO public.transactions (from_user_id, to_user_id, amount, type, status, reference)
  VALUES (NULL, p_user_id, p_amount, 'deposit', 'completed', p_reference)
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Update withdrawal RPC to use withdrawable_balance
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount        NUMERIC,
  p_metadata      JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_txn_id  UUID;
BEGIN
  -- Deduct withdrawable wallet immediately to prevent double spending
  UPDATE public.profiles
  SET withdrawable_balance = withdrawable_balance - p_amount
  WHERE id = v_user_id AND withdrawable_balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient withdrawable balance for withdrawal';
  END IF;

  -- Insert pending withdrawal transaction
  INSERT INTO public.transactions (from_user_id, to_user_id, amount, type, status, metadata)
  VALUES (v_user_id, NULL, p_amount, 'withdrawal', 'pending', p_metadata)
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. Implement Waterfall Logic for Escrow Locks
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.lock_milestone_escrow(
  p_contract_id   UUID,
  p_milestone_id  TEXT,
  p_amount        NUMERIC
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_contract      public.contracts%ROWTYPE;
  v_txn_id        UUID;
  v_dep_bal       NUMERIC;
  v_with_bal      NUMERIC;
  v_remainder     NUMERIC;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id;

  -- Lock the profile row for update
  SELECT deposit_balance, withdrawable_balance INTO v_dep_bal, v_with_bal 
  FROM public.profiles 
  WHERE id = v_contract.client_id 
  FOR UPDATE;

  -- Verify total available funds
  IF (v_dep_bal + v_with_bal) < p_amount THEN
    RAISE EXCEPTION 'Insufficient total balance for escrow lock';
  END IF;

  -- Waterfall spending logic
  IF v_dep_bal >= p_amount THEN
    -- Deduct entirely from deposit_balance
    UPDATE public.profiles 
    SET deposit_balance = deposit_balance - p_amount 
    WHERE id = v_contract.client_id;
  ELSE
    -- Deduct what we can from deposit_balance, and the rest from withdrawable_balance
    v_remainder := p_amount - v_dep_bal;
    UPDATE public.profiles 
    SET deposit_balance = 0,
        withdrawable_balance = withdrawable_balance - v_remainder
    WHERE id = v_contract.client_id;
  END IF;

  INSERT INTO public.transactions (contract_id, from_user_id, amount, type, status, milestone_id)
  VALUES (p_contract_id, v_contract.client_id, p_amount, 'escrow_lock', 'completed', p_milestone_id)
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 5. Release Escrow directly into Withdrawable Balance
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.release_milestone_escrow(
  p_contract_id   UUID,
  p_milestone_id  TEXT,
  p_fee_pct       NUMERIC DEFAULT 0.10
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_contract      public.contracts%ROWTYPE;
  v_amount        NUMERIC;
  v_fee           NUMERIC;
  v_txn_id        UUID;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id;

  -- Get the locked amount for this milestone from latest escrow_lock
  SELECT amount INTO v_amount
  FROM public.transactions
  WHERE contract_id = p_contract_id
    AND milestone_id = p_milestone_id
    AND type = 'escrow_lock'
    AND status = 'completed'
  ORDER BY created_at DESC LIMIT 1;

  IF v_amount IS NULL THEN
    RAISE EXCEPTION 'No escrow lock found for milestone %', p_milestone_id;
  END IF;

  v_fee := ROUND(v_amount * p_fee_pct, 2);

  -- Credit freelancer's withdrawable wallet (minus platform fee)
  UPDATE public.profiles
  SET withdrawable_balance = withdrawable_balance + (v_amount - v_fee)
  WHERE id = v_contract.freelancer_id;

  INSERT INTO public.transactions (contract_id, from_user_id, to_user_id, amount, fee, type, status, milestone_id)
  VALUES (p_contract_id, v_contract.client_id, v_contract.freelancer_id, v_amount, v_fee, 'escrow_release', 'completed', p_milestone_id)
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. New RPC for Safe Escrow Refunds (Contract Cancellation)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refund_escrow_cancellation(
  p_contract_id UUID,
  p_amount NUMERIC
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT client_id INTO v_client_id FROM public.contracts WHERE id = p_contract_id;

  -- Refunds from cancelled contracts are returned to the deposit_balance
  -- to prevent laundering deposited funds into withdrawable funds.
  UPDATE public.profiles 
  SET deposit_balance = deposit_balance + p_amount 
  WHERE id = v_client_id;

  -- Record the refund transaction
  INSERT INTO public.transactions (contract_id, from_user_id, to_user_id, amount, type, status)
  VALUES (p_contract_id, v_client_id, v_client_id, p_amount, 'refund', 'completed');
END;
$$;
