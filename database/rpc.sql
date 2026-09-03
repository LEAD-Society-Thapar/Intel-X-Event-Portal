-- ============================================================
-- INTEL-X PORTAL — RPC Functions
-- Run AFTER schema.sql and seed.sql in the Supabase SQL Editor.
--
-- All team-facing mutations are SECURITY DEFINER so they
-- bypass RLS (the anon role has no direct write access).
-- Admin-only RPCs check auth.role() = 'authenticated' inside.
-- ============================================================


-- ============================================================
-- RPC: unlock_airport
-- Called by teams. Atomically verifies balance ≥ cost, deducts,
-- creates unlock record, and writes the audit log entry.
-- ============================================================
CREATE OR REPLACE FUNCTION unlock_airport(p_team_id UUID, p_airport_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost         INTEGER;
  v_airport_name TEXT;
  v_balance      INTEGER;
  v_exists       BOOLEAN;
BEGIN
  -- Validate airport
  SELECT cost, name INTO v_cost, v_airport_name
    FROM airports WHERE id = p_airport_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Airport not found';
  END IF;

  -- Already unlocked?
  SELECT EXISTS(
    SELECT 1 FROM team_airport_unlocks
     WHERE team_id = p_team_id AND airport_id = p_airport_id
  ) INTO v_exists;
  IF v_exists THEN
    RAISE EXCEPTION 'Airport already unlocked';
  END IF;

  -- Lock team row, check balance
  SELECT credits_balance INTO v_balance
    FROM teams WHERE id = p_team_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found';
  END IF;
  IF v_balance < v_cost THEN
    RAISE EXCEPTION 'Insufficient credits. Need %, have %', v_cost, v_balance;
  END IF;

  -- Deduct
  UPDATE teams SET credits_balance = credits_balance - v_cost
   WHERE id = p_team_id;

  -- Record unlock
  INSERT INTO team_airport_unlocks (team_id, airport_id)
  VALUES (p_team_id, p_airport_id);

  -- Audit
  INSERT INTO credit_transactions (team_id, amount, reason)
  VALUES (p_team_id, -v_cost, 'Airport unlock: ' || v_airport_name);

  RETURN json_build_object(
    'success', true,
    'new_balance', v_balance - v_cost,
    'airport', v_airport_name
  );
END;
$$;


-- ============================================================
-- RPC: unlock_special_ops
-- Unlocks the dossier by deducting 15 credits
-- ============================================================
CREATE OR REPLACE FUNCTION unlock_special_ops(p_team_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance       INTEGER;
  v_already       BOOLEAN;
  v_current_phase game_phase;
  v_ops_cost      INTEGER := 15;
BEGIN
  -- Check game phase
  SELECT current_phase INTO v_current_phase FROM game_state LIMIT 1;
  IF v_current_phase NOT IN ('t20_special_ops', 't35_expansion') THEN
    RAISE EXCEPTION 'Special Operations are not currently available';
  END IF;

  -- Already unlocked?
  SELECT EXISTS(
    SELECT 1 FROM team_special_ops_unlocks WHERE team_id = p_team_id
  ) INTO v_already;
  IF v_already THEN
    RAISE EXCEPTION 'Special Operations dossier already unlocked';
  END IF;

  -- Lock team row, check balance
  SELECT credits_balance INTO v_balance
    FROM teams WHERE id = p_team_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found';
  END IF;
  IF v_balance < v_ops_cost THEN
    RAISE EXCEPTION 'Insufficient credits. Need %, have %', v_ops_cost, v_balance;
  END IF;

  -- Deduct
  UPDATE teams SET credits_balance = credits_balance - v_ops_cost
   WHERE id = p_team_id;

  -- Record unlock
  INSERT INTO team_special_ops_unlocks (team_id)
  VALUES (p_team_id);

  -- Audit
  INSERT INTO credit_transactions (team_id, amount, reason)
  VALUES (p_team_id, -v_ops_cost, 'Special Intelligence Operation Unlock');

  RETURN json_build_object(
    'success', true,
    'new_balance', v_balance - v_ops_cost
  );
END;
$$;


-- ============================================================
-- RPC: submit_special_ops
-- Called by teams to submit their hypothesis (free after unlock)
-- ============================================================
CREATE OR REPLACE FUNCTION submit_special_ops(p_team_id UUID, p_directive_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already       BOOLEAN;
  v_unlocked      BOOLEAN;
  v_current_phase game_phase;
BEGIN
  -- Check game phase
  SELECT current_phase INTO v_current_phase FROM game_state LIMIT 1;
  IF v_current_phase NOT IN ('t20_special_ops', 't35_expansion') THEN
    RAISE EXCEPTION 'Special Operations are not currently available';
  END IF;

  -- Verify unlocked
  SELECT EXISTS(
    SELECT 1 FROM team_special_ops_unlocks WHERE team_id = p_team_id
  ) INTO v_unlocked;
  IF NOT v_unlocked THEN
    RAISE EXCEPTION 'Special Operations dossier must be unlocked first';
  END IF;

  -- Already submitted?
  SELECT EXISTS(
    SELECT 1 FROM special_ops_submissions WHERE team_id = p_team_id
  ) INTO v_already;
  IF v_already THEN
    RAISE EXCEPTION 'Special Operations directive already submitted';
  END IF;

  -- Record submission
  INSERT INTO special_ops_submissions (team_id, directive_text)
  VALUES (p_team_id, p_directive_text);

  RETURN json_build_object(
    'success', true
  );
END;
$$;


-- ============================================================
-- RPC: place_bid
-- Called by teams. Records a sealed bid — no credits deducted
-- until admin resolves the auction winner.
-- ============================================================
CREATE OR REPLACE FUNCTION place_bid(p_team_id UUID, p_item_id UUID, p_bid_amount INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_phase game_phase;
  v_item_exists   BOOLEAN;
  v_already_bid   BOOLEAN;
BEGIN
  -- Check game phase
  SELECT current_phase INTO v_current_phase FROM game_state LIMIT 1;
  IF v_current_phase != 't50_auction' THEN
    RAISE EXCEPTION 'Auction is not currently open';
  END IF;

  -- Validate bid amount
  IF p_bid_amount <= 0 OR p_bid_amount != floor(p_bid_amount) THEN
    RAISE EXCEPTION 'Bid must be a positive whole number';
  END IF;

  -- Validate item
  SELECT EXISTS(
    SELECT 1 FROM auction_items WHERE id = p_item_id
  ) INTO v_item_exists;
  IF NOT v_item_exists THEN
    RAISE EXCEPTION 'Auction item not found';
  END IF;

  -- Already bid on this item?
  SELECT EXISTS(
    SELECT 1 FROM auction_bids
     WHERE team_id = p_team_id AND item_id = p_item_id
  ) INTO v_already_bid;
  IF v_already_bid THEN
    RAISE EXCEPTION 'You have already placed a bid on this item';
  END IF;

  -- Validate team exists
  IF NOT EXISTS(SELECT 1 FROM teams WHERE id = p_team_id) THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Record bid (no credit deduction yet)
  INSERT INTO auction_bids (team_id, item_id, bid_amount)
  VALUES (p_team_id, p_item_id, p_bid_amount);

  RETURN json_build_object('success', true, 'bid_amount', p_bid_amount);
END;
$$;





-- ============================================================
-- ADMIN-ONLY RPCs
-- These check auth.role() = 'authenticated' before executing.
-- ============================================================


-- ============================================================
-- RPC: set_round1_credits (admin only)
-- Sets the team's starting credit balance from Round 1.
-- Admin enters the credits remaining after Round 1 (0–100).
-- ============================================================
CREATE OR REPLACE FUNCTION set_round1_credits(
  p_team_id  UUID,
  p_credits  INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auth check
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Unauthorized — admin only';
  END IF;

  -- Validate range
  IF p_credits < 0 OR p_credits > 100 THEN
    RAISE EXCEPTION 'Credits must be between 0 and 100';
  END IF;

  -- Update team
  UPDATE teams SET credits_balance = p_credits
  WHERE id = p_team_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Audit
  INSERT INTO credit_transactions (team_id, amount, reason)
  VALUES (p_team_id, p_credits, 'Round 1 credits carry-forward');

  RETURN json_build_object(
    'success', true,
    'credits', p_credits
  );
END;
$$;


-- ============================================================
-- RPC: resolve_special_ops (admin only)
-- Admin picks an outcome tier; system awards score points.
-- ============================================================
CREATE OR REPLACE FUNCTION resolve_special_ops(
  p_submission_id UUID,
  p_outcome_tier  TEXT,
  p_narrative     TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id UUID;
  v_score   INTEGER;
BEGIN
  -- Auth check
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Unauthorized — admin only';
  END IF;

  -- Map outcome tier to score points
  v_score := CASE p_outcome_tier
    WHEN 'exceptional' THEN 40
    WHEN 'successful'  THEN 30
    WHEN 'partial'     THEN 20
    WHEN 'limited'     THEN 10
    WHEN 'failure'     THEN 0
    ELSE NULL
  END;
  IF v_score IS NULL THEN
    RAISE EXCEPTION 'Invalid outcome tier. Must be: exceptional, successful, partial, limited, failure';
  END IF;

  -- Get team_id and verify not already resolved
  SELECT team_id INTO v_team_id
    FROM special_ops_submissions
   WHERE id = p_submission_id AND resolved_by_admin = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already resolved';
  END IF;

  -- Update submission
  UPDATE special_ops_submissions SET
    outcome_tier      = p_outcome_tier,
    score_awarded     = v_score,
    resolved_by_admin = true,
    admin_narrative   = p_narrative
  WHERE id = p_submission_id;

  -- Award score to the team (if > 0)
  IF v_score > 0 THEN
    UPDATE teams SET score = score + v_score
     WHERE id = v_team_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'team_id', v_team_id,
    'outcome_tier', p_outcome_tier,
    'score_awarded', v_score
  );
END;
$$;


-- ============================================================
-- RPC: resolve_auction (admin only)
-- Assigns a winner for one auction item: deducts their bid
-- amount and marks the bid row as winner.
-- ============================================================
CREATE OR REPLACE FUNCTION resolve_auction(p_item_id UUID, p_winning_team_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bid_amount INTEGER;
  v_item_name  TEXT;
  v_balance    INTEGER;
BEGIN
  -- Auth check
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Unauthorized — admin only';
  END IF;

  -- Get the winning bid
  SELECT bid_amount INTO v_bid_amount
    FROM auction_bids
   WHERE team_id = p_winning_team_id AND item_id = p_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No bid found for this team/item combination';
  END IF;

  -- Get item name
  SELECT name INTO v_item_name FROM auction_items WHERE id = p_item_id;

  -- Lock team row and deduct
  SELECT credits_balance INTO v_balance
    FROM teams WHERE id = p_winning_team_id
    FOR UPDATE;
  
  UPDATE teams SET credits_balance = credits_balance - v_bid_amount
   WHERE id = p_winning_team_id;

  -- Mark as winner
  UPDATE auction_bids SET is_winner = true
   WHERE team_id = p_winning_team_id AND item_id = p_item_id;

  -- Audit
  INSERT INTO credit_transactions (team_id, amount, reason)
  VALUES (p_winning_team_id, -v_bid_amount, 'Auction won: ' || v_item_name);

  RETURN json_build_object(
    'success', true,
    'item', v_item_name,
    'winner_team_id', p_winning_team_id,
    'amount_deducted', v_bid_amount
  );
END;
$$;


-- ============================================================
-- RPC: advance_phase (admin only)
-- Updates game_state to a specific phase.
-- ============================================================
CREATE OR REPLACE FUNCTION advance_phase(p_new_phase game_phase)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auth check
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Unauthorized — admin only';
  END IF;

  UPDATE game_state SET
    current_phase    = p_new_phase,
    phase_started_at = now()
  WHERE current_phase IS NOT NULL;

  RETURN json_build_object('success', true, 'new_phase', p_new_phase);
END;
$$;





-- ============================================================
-- RPC: reset_game (admin only)
-- Wipes ALL gameplay data and resets the game to not_started.
-- Teams are preserved but their scores/credits are zeroed out.
-- ============================================================
CREATE OR REPLACE FUNCTION reset_game()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auth check
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Unauthorized — admin only';
  END IF;

  -- Wipe all transactional data
  DELETE FROM credit_transactions WHERE id IS NOT NULL;
  DELETE FROM team_airport_unlocks WHERE team_id IS NOT NULL;
  DELETE FROM team_special_ops_unlocks WHERE team_id IS NOT NULL;
  DELETE FROM special_ops_submissions WHERE id IS NOT NULL;
  DELETE FROM auction_bids WHERE id IS NOT NULL;
  DELETE FROM team_dossier_progress WHERE team_id IS NOT NULL;

  -- Reset game phase
  UPDATE game_state SET
    current_phase = 'not_started',
    phase_started_at = now()
  WHERE current_phase IS NOT NULL;

  -- Reset all team scores and credits
  UPDATE teams SET
    credits_balance = 0,
    score = 0
  WHERE id IS NOT NULL;

  RETURN json_build_object('success', true, 'message', 'Game fully reset');
END;
$$;


-- ============================================================
-- RPC: submit_dossier_answers
-- Auto-checks answers case-insensitively. Awards +10 per new
-- correct answer.
-- ============================================================
CREATE OR REPLACE FUNCTION submit_dossier_answers(
  p_team_id UUID,
  p_airport_id UUID,
  p_a1 TEXT,
  p_a2 TEXT,
  p_a3 TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unlocked BOOLEAN;
  v_keys airport_answer_keys%ROWTYPE;
  v_prog team_dossier_progress%ROWTYPE;
  v_q1_correct BOOLEAN := false;
  v_q2_correct BOOLEAN := false;
  v_q3_correct BOOLEAN := false;
  v_score_to_add INTEGER := 0;
BEGIN
  -- 1. Check if team unlocked this airport
  SELECT EXISTS(
    SELECT 1 FROM team_airport_unlocks
     WHERE team_id = p_team_id AND airport_id = p_airport_id
  ) INTO v_unlocked;
  IF NOT v_unlocked THEN
    RAISE EXCEPTION 'Airport not unlocked';
  END IF;

  -- 2. Fetch the correct answer keys
  SELECT * INTO v_keys FROM airport_answer_keys WHERE airport_id = p_airport_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Answers for this dossier are not configured';
  END IF;

  -- 3. Fetch current progress (or default to false)
  SELECT * INTO v_prog FROM team_dossier_progress
  WHERE team_id = p_team_id AND airport_id = p_airport_id
  FOR UPDATE;

  -- 4. Check each question
  -- Q1
  IF NOT COALESCE(v_prog.q1_solved, false) AND lower(trim(p_a1)) = lower(trim(v_keys.q1_answer)) THEN
    v_q1_correct := true;
    v_score_to_add := v_score_to_add + 10;
  END IF;
  -- Q2
  IF NOT COALESCE(v_prog.q2_solved, false) AND lower(trim(p_a2)) = lower(trim(v_keys.q2_answer)) THEN
    v_q2_correct := true;
    v_score_to_add := v_score_to_add + 10;
  END IF;
  -- Q3
  IF NOT COALESCE(v_prog.q3_solved, false) AND lower(trim(p_a3)) = lower(trim(v_keys.q3_answer)) THEN
    v_q3_correct := true;
    v_score_to_add := v_score_to_add + 10;
  END IF;

  -- 5. Upsert progress and award score if any new correct
  IF v_score_to_add > 0 THEN
    -- Upsert progress
    INSERT INTO team_dossier_progress (team_id, airport_id, q1_solved, q2_solved, q3_solved)
    VALUES (p_team_id, p_airport_id, v_q1_correct, v_q2_correct, v_q3_correct)
    ON CONFLICT (team_id, airport_id)
    DO UPDATE SET
      q1_solved = team_dossier_progress.q1_solved OR EXCLUDED.q1_solved,
      q2_solved = team_dossier_progress.q2_solved OR EXCLUDED.q2_solved,
      q3_solved = team_dossier_progress.q3_solved OR EXCLUDED.q3_solved;

    -- Add score
    UPDATE teams SET score = score + v_score_to_add
    WHERE id = p_team_id;

    -- (Optional) We could log score transactions if we created a score_transactions table, 
    -- but for now, we just update the score directly.
  END IF;

  RETURN json_build_object(
    'success', true,
    'q1_newly_correct', v_q1_correct,
    'q2_newly_correct', v_q2_correct,
    'q3_newly_correct', v_q3_correct,
    'score_awarded', v_score_to_add
  );
END;
$$;
