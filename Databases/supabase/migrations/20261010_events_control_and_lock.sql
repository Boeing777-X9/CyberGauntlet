-- =============================================================================
-- CYBERGAUNTLET EVENT CONTROL, DYNAMIC EXTENSIONS & SUBMISSION AUTO-LOCK
-- Run this in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create public.events table for live tournament management
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL DEFAULT 'CyberGauntlet 2026',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL DEFAULT (now() + interval '3 hours'),
  paused_at timestamptz,
  active_challenges jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow all players and admins to read event state
DROP POLICY IF EXISTS "Allow all users to read events" ON public.events;
CREATE POLICY "Allow all users to read events"
  ON public.events FOR SELECT
  USING (true);

-- Allow admins/organizers to create, update, or pause events
DROP POLICY IF EXISTS "Allow event management" ON public.events;
CREATE POLICY "Allow event management"
  ON public.events FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable real-time replication for events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. Insert initial draft event if none exists
INSERT INTO public.events (id, event_name, status, start_date, end_date)
SELECT 
  gen_random_uuid(),
  'CyberGauntlet 2026',
  'draft',
  now(),
  now() + interval '3 hours'
WHERE NOT EXISTS (SELECT 1 FROM public.events LIMIT 1);

-- 3. Clean up legacy dummy test questions and test audit teams if any
DELETE FROM public.challenges WHERE id IN ('q1', 'q2', 'q3', 'q4', 'q5');
DELETE FROM public.leaderboard WHERE team_name ILIKE '%audit%' OR team_name ILIKE '%test%';
DELETE FROM public.participants WHERE team_name ILIKE '%audit%' OR team_name ILIKE '%test%';
DELETE FROM public.challenge_sessions WHERE team_id ILIKE '%audit%' OR team_id ILIKE '%test%';

-- 4. Secure Flag Submission Function with Event Lock Checking
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
  v_event record;
BEGIN
  -- Check latest event status
  SELECT * INTO v_event
  FROM public.events
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_event IS NOT NULL THEN
    IF v_event.status = 'paused' THEN
      RETURN jsonb_build_object('success', false, 'is_correct', false, 'error', 'Competition is currently paused by admin. Submissions are temporarily locked.');
    END IF;
    IF v_event.status = 'ended' OR now() > v_event.end_date THEN
      RETURN jsonb_build_object('success', false, 'is_correct', false, 'error', 'Competition has ended. Submissions are locked.');
    END IF;
    IF v_event.status = 'draft' AND now() < v_event.start_date THEN
      RETURN jsonb_build_object('success', false, 'is_correct', false, 'error', 'Competition has not started yet.');
    END IF;
  END IF;

  -- 1. Get correct flag hash
  SELECT correct_flag_hash INTO v_stored_hash
  FROM public.challenge_validations
  WHERE challenge_id = p_challenge_id;

  IF v_stored_hash IS NULL THEN
    -- Fallback to hashing correct_flag from challenges table
    SELECT encode(digest(correct_flag, 'sha256'), 'hex') INTO v_stored_hash
    FROM public.challenges
    WHERE id = p_challenge_id;
  END IF;

  IF v_stored_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'is_correct', false, 'error', 'Challenge not found');
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

  -- 4. Correct flag! Points: Easy = 100, Medium = 200, Hard = 300
  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id;
  IF v_challenge.difficulty = 'Medium' OR v_challenge.difficulty = 'Intermediate' THEN 
    v_points := 200;
  ELSIF v_challenge.difficulty = 'Hard' OR v_challenge.difficulty = 'Advanced' THEN 
    v_points := 300;
  ELSE 
    v_points := 100;
  END IF;

  -- 5. Record solve on leaderboard
  INSERT INTO public.leaderboard (
    team_name, question_id, time_spent, attempts, hints_used, points, category, difficulty, idempotency_key, completed_at
  ) VALUES (
    p_team_name, p_challenge_id, p_time_spent, p_attempts, p_hints_used, v_points, v_challenge.category, v_challenge.difficulty, p_idempotency_key, now()
  )
  ON CONFLICT (team_name, question_id) DO NOTHING;

  -- 6. Mark challenge_sessions as completed
  UPDATE public.challenge_sessions
  SET is_completed = true,
      time_spent = p_time_spent,
      last_activity = now()
  WHERE team_id = p_team_name AND challenge_id = p_challenge_id;

  RETURN jsonb_build_object('is_correct', true, 'points', v_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
