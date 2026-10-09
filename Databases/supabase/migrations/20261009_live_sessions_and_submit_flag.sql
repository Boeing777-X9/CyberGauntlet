-- =============================================================================
-- LIVE ACTIVITY TRACKING & SECURE DB-LEVEL FLAG VALIDATION
-- =============================================================================

-- 1. Create or ensure challenge_sessions table exists for live monitoring
CREATE TABLE IF NOT EXISTS public.challenge_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL,
  challenge_id text NOT NULL,
  session_start_time timestamptz NOT NULL DEFAULT now(),
  first_attempt_time timestamptz,
  hint_reveal_count integer NOT NULL DEFAULT 0,
  wrong_attempt_count integer NOT NULL DEFAULT 0,
  time_spent integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, challenge_id)
);

ALTER TABLE public.challenge_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow players to upsert own sessions" ON public.challenge_sessions;
CREATE POLICY "Allow players to upsert own sessions"
  ON public.challenge_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_challenge_sessions_team ON public.challenge_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_challenge_sessions_activity ON public.challenge_sessions(last_activity DESC);

-- 2. Secure Flag Verification RPC (No Edge Function deployment required!)
-- Compares SHA-256 hash inside PostgreSQL and updates leaderboard automatically
CREATE OR REPLACE FUNCTION public.submit_flag(
  p_challenge_id text,
  p_submitted_flag text,
  p_team_name text,
  p_time_spent integer,
  p_attempts integer,
  p_hints_used integer,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_stored_hash text;
  v_submitted_hash text;
  v_challenge record;
  v_points integer := 100;
BEGIN
  -- 1. Get correct flag hash
  SELECT correct_flag_hash INTO v_stored_hash
  FROM public.challenge_validations
  WHERE challenge_id = p_challenge_id;

  IF v_stored_hash IS NULL THEN
    -- Fallback to hashing correct_flag from challenges table if validations table lacks it
    SELECT encode(digest(correct_flag, 'sha256'), 'hex') INTO v_stored_hash
    FROM public.challenges
    WHERE id = p_challenge_id;
  END IF;

  IF v_stored_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found');
  END IF;

  -- 2. Hash submitted flag
  v_submitted_hash := encode(digest(trim(p_submitted_flag), 'sha256'), 'hex');

  -- 3. Check match
  IF v_submitted_hash != v_stored_hash THEN
    -- Update wrong attempt count in challenge_sessions
    UPDATE public.challenge_sessions
    SET wrong_attempt_count = wrong_attempt_count + 1,
        time_spent = p_time_spent,
        last_activity = now()
    WHERE team_id = p_team_name AND challenge_id = p_challenge_id;

    RETURN jsonb_build_object('is_correct', false);
  END IF;

  -- 4. Correct flag! Fetch challenge points
  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id;
  IF v_challenge.difficulty = 'Intermediate' THEN v_points := 200;
  ELSIF v_challenge.difficulty = 'Advanced' THEN v_points := 300;
  END IF;

  -- 5. Record solve on leaderboard
  INSERT INTO public.leaderboard (
    team_name, question_id, time_spent, attempts, hints_used, points, category, difficulty, idempotency_key, completed_at
  ) VALUES (
    p_team_name, p_challenge_id, p_time_spent, p_attempts, p_hints_used, v_points, v_challenge.category, v_challenge.difficulty, p_idempotency_key, now()
  );

  -- 6. Mark challenge_sessions as completed
  UPDATE public.challenge_sessions
  SET is_completed = true,
      time_spent = p_time_spent,
      last_activity = now()
  WHERE team_id = p_team_name AND challenge_id = p_challenge_id;

  RETURN jsonb_build_object('is_correct', true, 'points', v_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
