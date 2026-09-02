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
-- RPC: submit_special_ops
-- Called by teams. One-time only, costs 15 credits up front.
-- ============================================================
CREATE OR REPLACE FUNCTION submit_special_ops(p_team_id UUID, p_directive_text TEXT)
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

  -- Already submitted?
  SELECT EXISTS(
    SELECT 1 FROM special_ops_submissions WHERE team_id = p_team_id
  ) INTO v_already;
  IF v_already THEN
    RAISE EXCEPTION 'Special Operations directive already submitted';
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

  -- Record submission
  INSERT INTO special_ops_submissions (team_id, directive_text)
  VALUES (p_team_id, p_directive_text);

  -- Audit
  INSERT INTO credit_transactions (team_id, amount, reason)
  VALUES (p_team_id, -v_ops_cost, 'Special Intelligence Operation');

  RETURN json_build_object(
    'success', true,
    'new_balance', v_balance - v_ops_cost
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
-- RPC: purchase_informer
-- Called by teams. Buys the Unknown Informer intel.
-- ============================================================
CREATE OR REPLACE FUNCTION purchase_informer(p_team_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active  BOOLEAN;
  v_cost    INTEGER;
  v_balance INTEGER;
  v_already BOOLEAN;
BEGIN
  -- Check stall is active
  SELECT informer_stall_active, informer_stall_cost
    INTO v_active, v_cost
    FROM game_state LIMIT 1;
  IF NOT v_active THEN
    RAISE EXCEPTION 'Informer Stall is not currently available';
  END IF;

  -- Already purchased?
  SELECT EXISTS(
    SELECT 1 FROM team_informer_purchases WHERE team_id = p_team_id
  ) INTO v_already;
  IF v_already THEN
    RAISE EXCEPTION 'Already purchased';
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

  -- Record purchase
  INSERT INTO team_informer_purchases (team_id) VALUES (p_team_id);

  -- Audit
  INSERT INTO credit_transactions (team_id, amount, reason)
  VALUES (p_team_id, -v_cost, 'Unknown Informer purchase');

  RETURN json_build_object('success', true, 'new_balance', v_balance - v_cost);
END;
$$;


-- ============================================================
-- ADMIN-ONLY RPCs
-- These check auth.role() = 'authenticated' before executing.
-- ============================================================


-- ============================================================
-- RPC: set_round1_scores (admin only)
-- Computes clearance tier and sets starting credit balance.
-- credits_balance = bag_scan + route_trace + id_check (0–60).
-- ============================================================
CREATE OR REPLACE FUNCTION set_round1_scores(
  p_team_id    UUID,
  p_bag_scan   INTEGER,
  p_route_trace INTEGER,
  p_id_check   INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total   INTEGER;
  v_tier    TEXT;
BEGIN
  -- Auth check
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Unauthorized — admin only';
  END IF;

  -- Validate ranges
  IF p_bag_scan < 0 OR p_bag_scan > 20 THEN
    RAISE EXCEPTION 'Bag Scan must be 0–20';
  END IF;
  IF p_route_trace < 0 OR p_route_trace > 20 THEN
    RAISE EXCEPTION 'Route Trace must be 0–20';
  END IF;
  IF p_id_check < 0 OR p_id_check > 20 THEN
    RAISE EXCEPTION 'ID Check must be 0–20';
  END IF;

  v_total := p_bag_scan + p_route_trace + p_id_check;

  -- Determine clearance tier
  v_tier := CASE
    WHEN v_total >= 51 THEN 'ALPHA'
    WHEN v_total >= 41 THEN 'BRAVO'
    WHEN v_total >= 31 THEN 'CHARLIE'
    WHEN v_total >= 21 THEN 'DELTA'
    ELSE 'LIMITED'
  END;

  -- Update team
  UPDATE teams SET
    round1_scores   = jsonb_build_object(
      'bag_scan', p_bag_scan,
      'route_trace', p_route_trace,
      'id_check', p_id_check
    ),
    clearance_tier  = v_tier,
    credits_balance = v_total
  WHERE id = p_team_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Audit
  INSERT INTO credit_transactions (team_id, amount, reason)
  VALUES (p_team_id, v_total, 'Round 1 carry-forward (' || v_tier || ')');

  RETURN json_build_object(
    'success', true,
    'total', v_total,
    'tier', v_tier,
    'credits', v_total
  );
END;
$$;


-- ============================================================
-- RPC: resolve_special_ops (admin only)
-- Admin picks an outcome tier; system auto-fills credits.
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
  v_credits INTEGER;
BEGIN
  -- Auth check
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Unauthorized — admin only';
  END IF;

  -- Map outcome tier to credits
  v_credits := CASE p_outcome_tier
    WHEN 'exceptional' THEN 40
    WHEN 'successful'  THEN 30
    WHEN 'partial'     THEN 20
    WHEN 'limited'     THEN 10
    WHEN 'failure'     THEN 0
    ELSE NULL
  END;
  IF v_credits IS NULL THEN
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
    credits_awarded   = v_credits,
    resolved_by_admin = true,
    admin_narrative   = p_narrative
  WHERE id = p_submission_id;

  -- Credit the team (if > 0)
  IF v_credits > 0 THEN
    UPDATE teams SET credits_balance = credits_balance + v_credits
     WHERE id = v_team_id;

    INSERT INTO credit_transactions (team_id, amount, reason)
    VALUES (v_team_id, v_credits, 'Special Ops result: ' || p_outcome_tier || ' (+' || v_credits || ')');
  END IF;

  RETURN json_build_object(
    'success', true,
    'team_id', v_team_id,
    'outcome_tier', p_outcome_tier,
    'credits_awarded', v_credits
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
-- RPC: toggle_informer (admin only)
-- Toggles the unknown informer stall status.
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_informer(p_active BOOLEAN)
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

  UPDATE game_state SET informer_stall_active = p_active
  WHERE current_phase IS NOT NULL;

  RETURN json_build_object('success', true, 'informer_active', p_active);
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
  DELETE FROM special_ops_submissions WHERE id IS NOT NULL;
  DELETE FROM auction_bids WHERE id IS NOT NULL;
  DELETE FROM team_informer_purchases WHERE team_id IS NOT NULL;

  -- Reset game phase
  UPDATE game_state SET
    current_phase = 'not_started',
    informer_stall_active = false,
    phase_started_at = now()
  WHERE current_phase IS NOT NULL;

  -- Reset all team scores and credits
  UPDATE teams SET
    credits_balance = 0,
    round1_scores = NULL,
    clearance_tier = NULL
  WHERE id IS NOT NULL;

  RETURN json_build_object('success', true, 'message', 'Game fully reset');
END;
$$;
