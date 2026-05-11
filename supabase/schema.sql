-- ============================================================
--  FreelanceDZ — Supabase PostgreSQL Schema
--  Author: Generated for Algerian Freelance Marketplace
--  Version: 1.0.0
-- ============================================================

-- ─────────────────────────────────────────────
--  EXTENSIONS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
--  ENUMS
-- ─────────────────────────────────────────────
CREATE TYPE user_role       AS ENUM ('client', 'freelancer', 'both');
CREATE TYPE job_status      AS ENUM ('open', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE contract_status AS ENUM ('active', 'paused', 'completed', 'disputed', 'cancelled');
CREATE TYPE txn_type        AS ENUM ('deposit', 'escrow_lock', 'escrow_release', 'refund', 'withdrawal', 'platform_fee');
CREATE TYPE txn_status      AS ENUM ('pending', 'completed', 'failed', 'reversed');
CREATE TYPE dispute_status  AS ENUM ('open', 'under_review', 'resolved_client', 'resolved_freelancer', 'closed');
CREATE TYPE skill_level     AS ENUM ('beginner', 'intermediate', 'expert');

-- ─────────────────────────────────────────────
--  TABLE: profiles
--  One row per auth.users entry. Extends Supabase Auth.
-- ─────────────────────────────────────────────
CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username         TEXT UNIQUE NOT NULL,
  full_name        TEXT,
  avatar_url       TEXT,
  bio              TEXT,
  role             user_role NOT NULL DEFAULT 'client',
  active_role      user_role NOT NULL DEFAULT 'client',   -- currently active context
  wilaya           SMALLINT CHECK (wilaya BETWEEN 1 AND 58),
  phone            TEXT,
  website          TEXT,
  skills           TEXT[],                                 -- e.g. ['React', 'Python', 'UI/UX']
  hourly_rate      NUMERIC(10, 2),
  is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin         BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned        BOOLEAN NOT NULL DEFAULT FALSE,
  rating           NUMERIC(3, 2) DEFAULT 0.00,
  total_reviews    INT NOT NULL DEFAULT 0,
  balance          NUMERIC(12, 2) NOT NULL DEFAULT 0.00,  -- wallet balance (DZD)
  language_pref    TEXT NOT NULL DEFAULT 'ar',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────
--  TABLE: skills_catalog  (optional normalized skills)
-- ─────────────────────────────────────────────
CREATE TABLE public.skills_catalog (
  id         SERIAL PRIMARY KEY,
  name_ar    TEXT NOT NULL,
  name_fr    TEXT NOT NULL,
  name_en    TEXT NOT NULL,
  category   TEXT NOT NULL,   -- e.g. 'development', 'design', 'marketing'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  TABLE: jobs
-- ─────────────────────────────────────────────
CREATE TABLE public.jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,
  required_skills TEXT[],
  budget_min      NUMERIC(12, 2),
  budget_max      NUMERIC(12, 2),
  deadline        DATE,
  status          job_status NOT NULL DEFAULT 'open',
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  attachments     TEXT[],                              -- Supabase Storage URLs
  views_count     INT NOT NULL DEFAULT 0,
  proposals_count INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT budget_range CHECK (budget_min <= budget_max)
);

CREATE INDEX idx_jobs_status     ON public.jobs(status);
CREATE INDEX idx_jobs_client_id  ON public.jobs(client_id);
CREATE INDEX idx_jobs_category   ON public.jobs(category);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-increment proposal count
CREATE OR REPLACE FUNCTION public.increment_proposal_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs SET proposals_count = proposals_count + 1 WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jobs SET proposals_count = GREATEST(proposals_count - 1, 0) WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$$;

-- ─────────────────────────────────────────────
--  TABLE: proposals
-- ─────────────────────────────────────────────
CREATE TABLE public.proposals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id         UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  freelancer_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter   TEXT NOT NULL,
  bid_amount     NUMERIC(12, 2) NOT NULL,
  delivery_days  INT NOT NULL CHECK (delivery_days > 0),
  status         proposal_status NOT NULL DEFAULT 'pending',
  milestones     JSONB,   -- [{title, amount, due_date, description}]
  attachments    TEXT[],
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, freelancer_id)
);

CREATE INDEX idx_proposals_job_id        ON public.proposals(job_id);
CREATE INDEX idx_proposals_freelancer_id ON public.proposals(freelancer_id);
CREATE INDEX idx_proposals_status        ON public.proposals(status);

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER proposals_count_trigger
  AFTER INSERT OR DELETE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.increment_proposal_count();

-- ─────────────────────────────────────────────
--  TABLE: contracts
-- ─────────────────────────────────────────────
CREATE TABLE public.contracts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES public.jobs(id),
  proposal_id     UUID NOT NULL REFERENCES public.proposals(id),
  client_id       UUID NOT NULL REFERENCES public.profiles(id),
  freelancer_id   UUID NOT NULL REFERENCES public.profiles(id),
  title           TEXT NOT NULL,
  total_amount    NUMERIC(12, 2) NOT NULL,
  platform_fee    NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- 5% platform fee
  milestones      JSONB NOT NULL DEFAULT '[]',          -- [{id, title, amount, status, due_date, approved_at}]
  status          contract_status NOT NULL DEFAULT 'active',
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date        DATE,
  terms           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_id)
);

CREATE INDEX idx_contracts_client_id     ON public.contracts(client_id);
CREATE INDEX idx_contracts_freelancer_id ON public.contracts(freelancer_id);
CREATE INDEX idx_contracts_status        ON public.contracts(status);

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────
--  TABLE: messages
--  Rooms are identified by sorted pair of user IDs or contract_id
-- ─────────────────────────────────────────────
CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id     UUID NOT NULL,               -- derived: uuid5(sorted sender+receiver) or contract_id
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id),
  content     TEXT,
  attachments TEXT[],
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (sender_id <> receiver_id),
  CHECK (content IS NOT NULL OR attachments IS NOT NULL)
);

CREATE INDEX idx_messages_room_id    ON public.messages(room_id, created_at DESC);
CREATE INDEX idx_messages_sender     ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver   ON public.messages(receiver_id);
CREATE INDEX idx_messages_unread     ON public.messages(receiver_id, is_read) WHERE is_read = FALSE;

-- Helper function to generate deterministic room_id from two user IDs
CREATE OR REPLACE FUNCTION public.get_room_id(user_a UUID, user_b UUID)
RETURNS UUID LANGUAGE sql IMMUTABLE AS $$
  SELECT uuid5(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::UUID,
    CONCAT(LEAST(user_a::TEXT, user_b::TEXT), '-', GREATEST(user_a::TEXT, user_b::TEXT))
  );
$$;

-- ─────────────────────────────────────────────
--  TABLE: transactions
-- ─────────────────────────────────────────────
CREATE TABLE public.transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID REFERENCES public.contracts(id),
  from_user_id    UUID REFERENCES public.profiles(id),
  to_user_id      UUID REFERENCES public.profiles(id),
  amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  fee             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_amount      NUMERIC(12, 2) GENERATED ALWAYS AS (amount - fee) STORED,
  type            txn_type NOT NULL,
  status          txn_status NOT NULL DEFAULT 'pending',
  reference       TEXT UNIQUE,             -- external payment ref (Baridi / CIB / etc.)
  milestone_id    TEXT,                    -- JSON milestone id from contracts.milestones
  note            TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_txn_contract_id  ON public.transactions(contract_id);
CREATE INDEX idx_txn_from_user    ON public.transactions(from_user_id);
CREATE INDEX idx_txn_to_user      ON public.transactions(to_user_id);
CREATE INDEX idx_txn_status       ON public.transactions(status);
CREATE INDEX idx_txn_type         ON public.transactions(type);

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────
--  TABLE: reviews
-- ─────────────────────────────────────────────
CREATE TABLE public.reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id   UUID NOT NULL REFERENCES public.contracts(id),
  reviewer_id   UUID NOT NULL REFERENCES public.profiles(id),
  reviewee_id   UUID NOT NULL REFERENCES public.profiles(id),
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id, reviewer_id)
);

-- Recalculate rating on review insert/update
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.profiles
  SET
    rating = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.reviews WHERE reviewee_id = NEW.reviewee_id),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_update_rating
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_user_rating();

-- ─────────────────────────────────────────────
--  TABLE: disputes
-- ─────────────────────────────────────────────
CREATE TABLE public.disputes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id    UUID NOT NULL REFERENCES public.contracts(id),
  raised_by      UUID NOT NULL REFERENCES public.profiles(id),
  against        UUID NOT NULL REFERENCES public.profiles(id),
  reason         TEXT NOT NULL,
  evidence       TEXT[],
  status         dispute_status NOT NULL DEFAULT 'open',
  admin_notes    TEXT,
  resolved_by    UUID REFERENCES public.profiles(id),
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────
--  TABLE: notifications
-- ─────────────────────────────────────────────
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,   -- 'new_proposal', 'contract_started', 'payment_released', 'new_message', etc.
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
--  ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_catalog ENABLE ROW LEVEL SECURITY;

-- ── Helper: check if current user is admin ──────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), FALSE);
$$;

-- ── PROFILES ────────────────────────────────────────────────
-- Public profiles are readable by everyone (for marketplace browsing)
CREATE POLICY "profiles_public_read"
  ON public.profiles FOR SELECT
  USING (NOT is_banned OR auth.uid() = id OR public.is_admin());

-- Users can update only their own profile
CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid())  -- can't promote self
    AND is_banned = (SELECT is_banned FROM public.profiles WHERE id = auth.uid()) -- can't unban self
  );

-- Admin can do anything
CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- ── JOBS ────────────────────────────────────────────────────
CREATE POLICY "jobs_public_read"
  ON public.jobs FOR SELECT
  USING (status = 'open' OR client_id = auth.uid() OR public.is_admin());

CREATE POLICY "jobs_client_insert"
  ON public.jobs FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND (SELECT active_role FROM public.profiles WHERE id = auth.uid()) IN ('client', 'both')
  );

CREATE POLICY "jobs_client_update"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "jobs_client_delete"
  ON public.jobs FOR DELETE
  USING (auth.uid() = client_id AND status = 'open' OR public.is_admin());

-- ── PROPOSALS ───────────────────────────────────────────────
-- Freelancer can see own proposals; client can see proposals on their jobs
CREATE POLICY "proposals_read"
  ON public.proposals FOR SELECT
  USING (
    auth.uid() = freelancer_id
    OR auth.uid() = (SELECT client_id FROM public.jobs WHERE id = job_id)
    OR public.is_admin()
  );

CREATE POLICY "proposals_freelancer_insert"
  ON public.proposals FOR INSERT
  WITH CHECK (
    auth.uid() = freelancer_id
    AND (SELECT active_role FROM public.profiles WHERE id = auth.uid()) IN ('freelancer', 'both')
    AND (SELECT status FROM public.jobs WHERE id = job_id) = 'open'
  );

CREATE POLICY "proposals_update"
  ON public.proposals FOR UPDATE
  USING (
    auth.uid() = freelancer_id   -- freelancer can withdraw
    OR auth.uid() = (SELECT client_id FROM public.jobs WHERE id = job_id)  -- client can accept/reject
    OR public.is_admin()
  );

-- ── CONTRACTS ───────────────────────────────────────────────
CREATE POLICY "contracts_parties_read"
  ON public.contracts FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = freelancer_id OR public.is_admin());

CREATE POLICY "contracts_system_insert"
  ON public.contracts FOR INSERT
  WITH CHECK (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "contracts_parties_update"
  ON public.contracts FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = freelancer_id OR public.is_admin());

-- ── MESSAGES ────────────────────────────────────────────────
CREATE POLICY "messages_parties_read"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

CREATE POLICY "messages_sender_insert"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_mark_read"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id OR public.is_admin())
  WITH CHECK (is_read = TRUE AND content = (SELECT content FROM public.messages WHERE id = messages.id));

-- ── TRANSACTIONS ─────────────────────────────────────────────
-- Only involved parties + admin can see
CREATE POLICY "txn_parties_read"
  ON public.transactions FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id OR public.is_admin());

-- Only system/admin can insert transactions (use service role in backend)
CREATE POLICY "txn_admin_write"
  ON public.transactions FOR INSERT
  WITH CHECK (public.is_admin());

-- ── REVIEWS ──────────────────────────────────────────────────
CREATE POLICY "reviews_public_read"   ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_parties_write" ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.contracts
      WHERE id = contract_id
        AND (client_id = auth.uid() OR freelancer_id = auth.uid())
        AND status = 'completed'
    )
  );

-- ── DISPUTES ─────────────────────────────────────────────────
CREATE POLICY "disputes_parties_read"
  ON public.disputes FOR SELECT
  USING (auth.uid() = raised_by OR auth.uid() = against OR public.is_admin());

CREATE POLICY "disputes_parties_insert"
  ON public.disputes FOR INSERT
  WITH CHECK (
    auth.uid() = raised_by
    AND EXISTS (
      SELECT 1 FROM public.contracts
      WHERE id = contract_id AND (client_id = auth.uid() OR freelancer_id = auth.uid())
    )
  );

CREATE POLICY "disputes_admin_update"
  ON public.disputes FOR UPDATE
  USING (public.is_admin());

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE POLICY "notif_owner_read"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "notif_owner_update"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ── SKILLS CATALOG ────────────────────────────────────────────
CREATE POLICY "skills_public_read" ON public.skills_catalog FOR SELECT USING (TRUE);
CREATE POLICY "skills_admin_write" ON public.skills_catalog FOR ALL USING (public.is_admin());

-- ============================================================
--  ADMIN DASHBOARD VIEW  (only accessible via is_admin())
-- ============================================================
CREATE OR REPLACE VIEW public.admin_overview AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE NOT is_admin)                    AS total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '30 days') AS new_users_30d,
  (SELECT COUNT(*) FROM public.jobs WHERE status = 'open')                     AS active_jobs,
  (SELECT COUNT(*) FROM public.contracts WHERE status = 'active')              AS active_contracts,
  (SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE type = 'escrow_lock' AND status = 'completed') AS total_escrowed_dzd,
  (SELECT COALESCE(SUM(fee), 0)    FROM public.transactions WHERE type = 'escrow_release' AND status = 'completed') AS total_fees_collected,
  (SELECT COUNT(*) FROM public.disputes WHERE status = 'open')                 AS open_disputes,
  (SELECT COUNT(*) FROM public.profiles WHERE is_banned)                       AS banned_users;

-- Restrict admin view to admins
ALTER VIEW public.admin_overview OWNER TO authenticated;
CREATE POLICY "admin_view_only" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- ============================================================
--  ESCROW FUNCTIONS
-- ============================================================

-- Lock funds into escrow when milestone starts
CREATE OR REPLACE FUNCTION public.lock_milestone_escrow(
  p_contract_id   UUID,
  p_milestone_id  TEXT,
  p_amount        NUMERIC
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_contract      public.contracts%ROWTYPE;
  v_txn_id        UUID;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract_id;

  -- Debit client wallet
  UPDATE public.profiles
  SET balance = balance - p_amount
  WHERE id = v_contract.client_id AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance for escrow lock';
  END IF;

  INSERT INTO public.transactions (contract_id, from_user_id, amount, type, status, milestone_id)
  VALUES (p_contract_id, v_contract.client_id, p_amount, 'escrow_lock', 'completed', p_milestone_id)
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$;

-- Release escrow to freelancer after client approval
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

  -- Credit freelancer wallet (minus platform fee)
  UPDATE public.profiles
  SET balance = balance + (v_amount - v_fee)
  WHERE id = v_contract.freelancer_id;

  INSERT INTO public.transactions (contract_id, from_user_id, to_user_id, amount, fee, type, status, milestone_id)
  VALUES (p_contract_id, v_contract.client_id, v_contract.freelancer_id, v_amount, v_fee, 'escrow_release', 'completed', p_milestone_id)
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$;

-- ============================================================
--  FUNDING & WITHDRAWAL FUNCTIONS
-- ============================================================

-- Process a deposit from a webhook
CREATE OR REPLACE FUNCTION public.process_deposit(
  p_user_id       UUID,
  p_amount        NUMERIC,
  p_reference     TEXT
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_txn_id UUID;
BEGIN
  -- Credit user wallet
  UPDATE public.profiles
  SET balance = balance + p_amount
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

-- Request a withdrawal (Freelancer)
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount        NUMERIC
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_txn_id  UUID;
BEGIN
  -- Deduct user wallet immediately to prevent double spending
  UPDATE public.profiles
  SET balance = balance - p_amount
  WHERE id = v_user_id AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal';
  END IF;

  -- Insert pending withdrawal transaction
  INSERT INTO public.transactions (from_user_id, to_user_id, amount, type, status)
  VALUES (v_user_id, NULL, p_amount, 'withdrawal', 'pending')
  RETURNING id INTO v_txn_id;

  RETURN v_txn_id;
END;
$$;

-- ============================================================
--  SEED: Skills Catalog (Sample)
-- ============================================================
INSERT INTO public.skills_catalog (name_ar, name_fr, name_en, category) VALUES
  ('تطوير الويب',          'Développement Web',       'Web Development',      'development'),
  ('تطوير تطبيقات الموبايل', 'Développement Mobile', 'Mobile Development',   'development'),
  ('تصميم الجرافيك',       'Design Graphique',        'Graphic Design',       'design'),
  ('تصميم واجهة المستخدم', 'Design UI/UX',            'UI/UX Design',         'design'),
  ('الترجمة',              'Traduction',               'Translation',          'language'),
  ('تسويق رقمي',           'Marketing Digital',        'Digital Marketing',    'marketing'),
  ('كتابة المحتوى',        'Rédaction de Contenu',     'Content Writing',      'writing'),
  ('تحليل البيانات',       'Analyse de Données',       'Data Analysis',        'data'),
  ('الأمن المعلوماتي',     'Cybersécurité',            'Cybersecurity',        'development'),
  ('الذكاء الاصطناعي',    'Intelligence Artificielle', 'Artificial Intelligence', 'development'),
  ('تصميم الشعار',         'Design de Logo',           'Logo Design',          'design'),
  ('إدارة المشاريع',       'Gestion de Projet',        'Project Management',   'business');
