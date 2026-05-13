-- ============================================================
--  Deposit System — SQL Script
--  Run in Supabase SQL Editor
-- ============================================================

-- 1. Add columns to transactions table
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url    TEXT;

-- 2. Create receipts storage bucket (public for easy access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for receipts bucket
CREATE POLICY "authenticated users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "public can read receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- 4. RPC: request_deposit — atomic deposit transaction insert
CREATE OR REPLACE FUNCTION public.request_deposit(
  p_user_id       UUID,
  p_amount        NUMERIC,
  p_method        TEXT,
  p_receipt_url   TEXT DEFAULT NULL
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

  -- Require receipt for CCP and BaridiMob
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
    note
  ) VALUES (
    p_user_id,
    p_amount,
    'deposit',
    'pending',
    p_method,
    p_receipt_url,
    'طلب إيداع — بانتظار التأكيد'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
