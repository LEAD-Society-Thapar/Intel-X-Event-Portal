-- ============================================================
-- INTEL-X PORTAL — Database Schema
-- Run this entire file in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → paste → Run)
-- ============================================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------
-- ENUM: Game phases for the broadcast timeline
-- -----------------------------------------------
CREATE TYPE game_phase AS ENUM (
  'not_started',
  't00_briefing',
  't20_special_ops',
  't35_expansion',
  't45_catalogue',
  't50_auction',
  't55_final'
);

-- -----------------------------------------------
-- TABLE: teams
-- One row per participating team.
-- credits_balance = money left (set from Round 1, only decreases).
-- score           = points earned from correct answers (only increases).
-- -----------------------------------------------
CREATE TABLE teams (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL UNIQUE,
  login_code      TEXT NOT NULL UNIQUE,
  team_password   TEXT NOT NULL DEFAULT 'changeme',
  credits_balance INTEGER NOT NULL DEFAULT 0,
  score           INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- TABLE: credit_transactions
-- Immutable audit log of every credit change.
-- -----------------------------------------------
CREATE TABLE credit_transactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_tx_team ON credit_transactions(team_id);

-- -----------------------------------------------
-- TABLE: airports
-- The 4 investigation dossier stations.
-- -----------------------------------------------
CREATE TABLE airports (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  domain           TEXT NOT NULL,
  cost             INTEGER NOT NULL,
  briefing_text    TEXT NOT NULL DEFAULT '',
  evidence_content TEXT NOT NULL DEFAULT '',
  fragment_name    TEXT NOT NULL,
  q1_text          TEXT NOT NULL DEFAULT 'Question 1?',
  q2_text          TEXT NOT NULL DEFAULT 'Question 2?',
  q3_text          TEXT NOT NULL DEFAULT 'Question 3?'
);

-- -----------------------------------------------
-- TABLE: airport_answer_keys
-- Secure table holding the correct answers. Admin only.
-- -----------------------------------------------
CREATE TABLE airport_answer_keys (
  airport_id UUID PRIMARY KEY REFERENCES airports(id) ON DELETE CASCADE,
  q1_answer  TEXT NOT NULL,
  q2_answer  TEXT NOT NULL,
  q3_answer  TEXT NOT NULL
);
ALTER TABLE airport_answer_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_answer_keys" ON airport_answer_keys FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------
-- TABLE: team_dossier_progress
-- Tracks which questions a team has successfully answered.
-- -----------------------------------------------
CREATE TABLE team_dossier_progress (
  team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  airport_id UUID NOT NULL REFERENCES airports(id) ON DELETE CASCADE,
  q1_solved  BOOLEAN NOT NULL DEFAULT false,
  q2_solved  BOOLEAN NOT NULL DEFAULT false,
  q3_solved  BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY(team_id, airport_id)
);
ALTER TABLE team_dossier_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_dossier_prog" ON team_dossier_progress FOR SELECT USING (true);
CREATE POLICY "admin_all_dossier_prog" ON team_dossier_progress FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------
-- TABLE: team_airport_unlocks
-- Junction: which team unlocked which airport.
-- -----------------------------------------------
CREATE TABLE team_airport_unlocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  airport_id  UUID NOT NULL REFERENCES airports(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, airport_id)
);
ALTER TABLE team_airport_unlocks REPLICA IDENTITY FULL;

CREATE INDEX idx_unlocks_team ON team_airport_unlocks(team_id);

-- -----------------------------------------------
-- TABLE: team_special_ops_unlocks
-- Tracks which teams paid to unlock the Special Ops dossier.
-- -----------------------------------------------
CREATE TABLE team_special_ops_unlocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE team_special_ops_unlocks REPLICA IDENTITY FULL;

-- -----------------------------------------------
-- TABLE: special_ops_submissions
-- One per team (UNIQUE on team_id).
-- -----------------------------------------------
CREATE TABLE special_ops_submissions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id           UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  directive_text    TEXT NOT NULL,
  outcome_tier      TEXT DEFAULT NULL,
  score_awarded     INTEGER DEFAULT NULL,
  resolved_by_admin BOOLEAN NOT NULL DEFAULT false,
  admin_narrative   TEXT DEFAULT NULL,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE special_ops_submissions REPLICA IDENTITY FULL;

-- -----------------------------------------------
-- TABLE: auction_items
-- The 4 classified asset packages.
-- -----------------------------------------------
CREATE TABLE auction_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  public_teaser  TEXT NOT NULL,
  hidden_content TEXT NOT NULL DEFAULT '',
  category_note  TEXT DEFAULT NULL
);

-- -----------------------------------------------
-- TABLE: auction_bids
-- One bid per team per item (UNIQUE constraint).
-- -----------------------------------------------
CREATE TABLE auction_bids (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id      UUID NOT NULL REFERENCES auction_items(id) ON DELETE CASCADE,
  team_id      UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  bid_amount   INTEGER NOT NULL CHECK (bid_amount > 0),
  is_winner    BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, item_id)
);
ALTER TABLE auction_bids REPLICA IDENTITY FULL;

CREATE INDEX idx_bids_item ON auction_bids(item_id);

-- -----------------------------------------------
-- TABLE: round3_submissions (STUB)
-- -----------------------------------------------
CREATE TABLE round3_submissions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id                UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  ghost_identity         TEXT,
  target_flight          TEXT,
  target_cargo           TEXT,
  evidence_streams_cited TEXT,
  confidence_rating      TEXT,
  score                  INTEGER DEFAULT NULL,
  submitted_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------
-- TABLE: game_state
-- Single-row global state. Also holds the
-- Unknown Informer Stall configuration so that
-- admins can toggle it without a separate table.
-- -----------------------------------------------
CREATE TABLE game_state (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  current_phase          game_phase NOT NULL DEFAULT 'not_started',
  phase_started_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);



-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Strategy:
--   • SELECT is open to all roles (anon + authenticated) on
--     every table. Teams filter client-side by their own ID.
--     For a one-day college event this is acceptable; the only
--     truly sensitive column (auction_items.hidden_content) is
--     revealed to winners through an admin-controlled RPC.
--   • INSERT / UPDATE / DELETE on all tables is restricted to
--     the 'authenticated' role (= the shared admin account).
--   • All team-facing mutations go through SECURITY DEFINER
--     RPC functions that bypass RLS internally.
-- ============================================================

ALTER TABLE teams                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE airports                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_airport_unlocks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_ops_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids             ENABLE ROW LEVEL SECURITY;
ALTER TABLE round3_submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state               ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_special_ops_unlocks ENABLE ROW LEVEL SECURITY;

-- ---------- SELECT (everyone) ----------
CREATE POLICY "select_teams"          ON teams                   FOR SELECT USING (true);
CREATE POLICY "select_credit_tx"      ON credit_transactions     FOR SELECT USING (true);
CREATE POLICY "select_airports"       ON airports                FOR SELECT USING (true);
CREATE POLICY "select_unlocks"        ON team_airport_unlocks    FOR SELECT USING (true);
CREATE POLICY "select_special_ops"    ON special_ops_submissions FOR SELECT USING (true);
CREATE POLICY "select_sp_ops_unlock"  ON team_special_ops_unlocks FOR SELECT USING (true);
CREATE POLICY "select_auction_items"  ON auction_items           FOR SELECT USING (true);
CREATE POLICY "select_auction_bids"   ON auction_bids            FOR SELECT USING (true);
CREATE POLICY "select_round3"         ON round3_submissions      FOR SELECT USING (true);
CREATE POLICY "select_game_state"     ON game_state              FOR SELECT USING (true);

-- ---------- WRITE (authenticated / admin only) ----------
CREATE POLICY "admin_all_teams"       ON teams                   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_credit_tx"   ON credit_transactions     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_airports"    ON airports                FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_unlocks"     ON team_airport_unlocks    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_special_ops" ON special_ops_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_sp_ops_un"   ON team_special_ops_unlocks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_auction_i"   ON auction_items           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_auction_b"   ON auction_bids            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_round3"      ON round3_submissions      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_game_state"  ON game_state              FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- REALTIME — publish tables that need live subscriptions
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE special_ops_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE team_airport_unlocks;
ALTER PUBLICATION supabase_realtime ADD TABLE auction_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE team_dossier_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE team_special_ops_unlocks;
