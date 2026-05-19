-- ============================================================
-- KYC (National ID Verification) — Database Migration
-- Run once in Supabase SQL Editor.
-- Idempotent: safe to run multiple times.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. Add KYC & Enhanced Profile columns to profiles
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status       TEXT DEFAULT 'none'
    CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_verified      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone_number     TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth    DATE,
  ADD COLUMN IF NOT EXISTS id_number_hash   TEXT; -- SHA-256 of national ID (duplicate detection)


-- ────────────────────────────────────────────────────────────
-- 2. KYC Submissions table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'approved', 'rejected')),
  id_type          TEXT        NOT NULL
                               CHECK (id_type IN ('national_id', 'passport', 'driving_license')),
  id_number_hash   TEXT,                    -- SHA-256 of the raw ID number
  id_front_url     TEXT        NOT NULL,    -- Storage path: {userId}/front.jpg
  id_back_url      TEXT,                    -- Storage path: {userId}/back.jpg  (optional)
  selfie_url       TEXT,                    -- Storage path: {userId}/selfie.jpg (optional)
  rejection_reason TEXT,                    -- Admin fills this on rejection
  reviewed_by      UUID        REFERENCES public.profiles(id),
  reviewed_at      TIMESTAMPTZ,
  submitted_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- One active (pending/approved) submission per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS kyc_submissions_one_active_per_user
  ON public.kyc_submissions (user_id)
  WHERE status IN ('pending', 'approved');

-- Fast lookup by status for the admin review queue
CREATE INDEX IF NOT EXISTS kyc_submissions_status_idx
  ON public.kyc_submissions (status, submitted_at DESC);


-- ────────────────────────────────────────────────────────────
-- 3. Row-Level Security for kyc_submissions
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own submissions
DROP POLICY IF EXISTS "kyc_owner_select" ON public.kyc_submissions;
CREATE POLICY "kyc_owner_select"
  ON public.kyc_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own submissions
DROP POLICY IF EXISTS "kyc_owner_insert" ON public.kyc_submissions;
CREATE POLICY "kyc_owner_insert"
  ON public.kyc_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE for regular users — admin actions go through SECURITY DEFINER RPCs


-- ────────────────────────────────────────────────────────────
-- 4. Private Storage Bucket for KYC Documents
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,           -- PRIVATE — never publicly accessible
  10485760,        -- 10 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only upload to their own folder
DROP POLICY IF EXISTS "kyc_storage_owner_insert" ON storage.objects;
CREATE POLICY "kyc_storage_owner_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Users can read their own files (needed to show preview after upload)
DROP POLICY IF EXISTS "kyc_storage_owner_select" ON storage.objects;
CREATE POLICY "kyc_storage_owner_select"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Users can overwrite (update) their own files (re-submission)
DROP POLICY IF EXISTS "kyc_storage_owner_update" ON storage.objects;
CREATE POLICY "kyc_storage_owner_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );


-- ────────────────────────────────────────────────────────────
-- 5. RPC: submit_kyc
--    Called from the user-facing server action.
--    Prevents re-submission while a submission is pending/approved.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_kyc(
  p_user_id        UUID,
  p_id_type        TEXT,
  p_id_number_hash TEXT,
  p_id_front_url   TEXT,
  p_id_back_url    TEXT DEFAULT NULL,
  p_selfie_url     TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_status TEXT;
  v_submission_id   UUID;
BEGIN
  -- Block re-submission if already pending or approved
  SELECT status INTO v_existing_status
    FROM public.kyc_submissions
   WHERE user_id = p_user_id
     AND status IN ('pending', 'approved')
   LIMIT 1;

  IF v_existing_status = 'pending' THEN
    RAISE EXCEPTION 'ALREADY_PENDING';
  END IF;

  IF v_existing_status = 'approved' THEN
    RAISE EXCEPTION 'ALREADY_APPROVED';
  END IF;

  -- Block if same ID number hash already approved for a different user
  IF EXISTS (
    SELECT 1 FROM public.kyc_submissions
     WHERE id_number_hash = p_id_number_hash
       AND user_id <> p_user_id
       AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_ID';
  END IF;

  -- Insert the new submission
  INSERT INTO public.kyc_submissions (
    user_id, id_type, id_number_hash,
    id_front_url, id_back_url, selfie_url,
    status, submitted_at
  )
  VALUES (
    p_user_id, p_id_type, p_id_number_hash,
    p_id_front_url, p_id_back_url, p_selfie_url,
    'pending', NOW()
  )
  RETURNING id INTO v_submission_id;

  -- Update profile with pending status and submission timestamp
  UPDATE public.profiles
     SET kyc_status       = 'pending',
         kyc_submitted_at = NOW()
   WHERE id = p_user_id;

  RETURN v_submission_id;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 6. RPC: approve_kyc
--    Admin-only. Updates submission + sets is_verified on profile.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_kyc(
  p_submission_id UUID,
  p_admin_id      UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify the submission exists and is pending
  SELECT user_id INTO v_user_id
    FROM public.kyc_submissions
   WHERE id = p_submission_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'SUBMISSION_NOT_FOUND_OR_NOT_PENDING';
  END IF;

  -- Update the submission record
  UPDATE public.kyc_submissions
     SET status      = 'approved',
         reviewed_by = p_admin_id,
         reviewed_at = NOW()
   WHERE id = p_submission_id;

  -- Update the user's profile
  UPDATE public.profiles
     SET kyc_status  = 'approved',
         is_verified = TRUE
   WHERE id = v_user_id;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 7. RPC: reject_kyc
--    Admin-only. Records rejection reason; user can resubmit.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_kyc(
  p_submission_id  UUID,
  p_admin_id       UUID,
  p_reason         TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
    FROM public.kyc_submissions
   WHERE id = p_submission_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'SUBMISSION_NOT_FOUND_OR_NOT_PENDING';
  END IF;

  -- Update the submission record
  UPDATE public.kyc_submissions
     SET status           = 'rejected',
         reviewed_by      = p_admin_id,
         reviewed_at      = NOW(),
         rejection_reason = p_reason
   WHERE id = p_submission_id;

  -- Update the profile — user can now resubmit
  UPDATE public.profiles
     SET kyc_status  = 'rejected',
         is_verified = FALSE
   WHERE id = v_user_id;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- Done. Verify with:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name LIKE 'kyc%';
--
--   SELECT id, name, public FROM storage.buckets WHERE id = 'kyc-documents';
--
--   SELECT routine_name FROM information_schema.routines
--   WHERE routine_schema = 'public' AND routine_name LIKE '%kyc%';
-- ────────────────────────────────────────────────────────────
