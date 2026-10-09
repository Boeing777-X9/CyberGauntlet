-- =============================================================================
-- ALL 12 CTF CHALLENGES, FLAGS & ADVANCED VERIFICATION RPC
-- Run this in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- =============================================================================

-- Ensure pgcrypto is enabled for SHA-256 digesting
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Insert/Update all 12 challenges with their official flags
-- Stored in public.challenges which is protected by RLS
INSERT INTO public.challenges (id, title, description, file_name, file_path, correct_flag, hints, category, difficulty, is_active) VALUES
(
  'c1-dome-mirage',
  'The Dome''s Mirage',
  '[SCENARIO] We intercepted visual data feeds originating from the dome building at Manipal University Jaipur. The operative attempted to exfiltrate a secure routing code, but the transmission was split into identical-looking layers to avoid detection. Find the mathematical difference between the image feeds to reveal the hidden matrix.',
  'stego_1 (1).png',
  '/challenges/media/stego_1 (1).png',
  'quest{D0M3_M1R4G3_DIFF}',
  ARRAY[]::text[],
  'Steganography',
  'Medium',
  true
),
(
  'c2-ghs-frequency',
  'GHS Frequency',
  '[SCENARIO] A field agent sent back this standard photograph of GHS before their communications were heavily jammed. While the image looks completely normal on the surface, our scanners are picking up a massive data anomaly trailing at the very end of the file''s binary structure. Extract the payload and decode the secure message. Be warned: the target''s transmission is not meant for your ears.' || E'\n\nFlag format : flag{}',
  'stego_challenge (1).jpeg',
  '/challenges/media/stego_challenge (1).jpeg',
  'flag{GH5_FR3QU3NCY_TR4C3}',
  ARRAY['Check the end of file (EOF) or file appending data.', 'Look for an embedded audio stream or sound spectrum hidden within.'],
  'Steganography',
  'Hard',
  true
),
(
  'c3-structural-trace',
  'Structural Trace',
  '[SCENARIO] A suspicious video file was recovered from a compromised terminal in the administrative wing. The visual footage seems completely harmless, but the file size doesn''t quite add up. The attacker was careless and left a structural trace behind in the file''s properties. Analyze the video''s fingerprint to find the key, then dissect the file itself to pull out the hidden anomaly. Secure the flag before the data is lost.',
  'stego_challenge4.mp4',
  '/challenges/media/stego_challenge4.mp4',
  'quest{5TRUCTUR4L_V1D30_TR4C3}',
  ARRAY['Check metadata and video tags for hidden passwords or hashes.', 'Carve out embedded zip or appended binary chunks from the mp4.'],
  'Steganography',
  'Hard',
  true
),
(
  'c4-crests-secret',
  'The Crest''s Secret',
  '[SCENARIO] Our college club recently distributed this official logo, but rumors are circulating that the executive committee hid a secret initiation code inside the file. At first glance, it looks like a standard high-quality crest. Basic forensics will give you a breadcrumb, but don''t be fooled—it''s a trap for amateurs. You will need to dig much deeper into the image to extract the true message. Can you bypass the lock and secure the flag?',
  'stego_challenge3.jpeg',
  '/challenges/media/stego_challenge3.jpeg',
  'quest{CR35T_S3CR3T_K3Y}',
  ARRAY[]::text[],
  'Forensics',
  'Medium',
  true
),
(
  'c5-corrupted-drive',
  'Corrupted Drive',
  '[SCENARIO] A ransomware attack hit the clinic''s local drive. We stopped the encryption process and managed to intercept the attacker''s extraction password: infected2026. However, this critical data file was partially corrupted during the attack, and the operating system doesn''t recognize the file type anymore. Repair the file''s header, restore it to its original format, and use the intercepted password to recover the flag inside.',
  'corrupted_patient_records.dat',
  '/challenges/media/corrupted_patient_records.dat',
  'quest{C0RRUPT3D_F1L3_R3P41R}',
  ARRAY['Open in a Hex Editor and inspect the first magic bytes.', 'Determine the target archive header and repair the signature.', 'Extract with password: infected2026'],
  'Miscellaneous',
  'Hard',
  true
),
(
  'c6-pre-production-panic',
  'Pre-Production Panic',
  '[SCENARIO] The Central Savings Agency (CSA) rushed the deployment of their new employee portal and accidentally exposed a live staging environment. It appears their development team hasn''t connected the backend validation yet, relying entirely on exposed local browser scripts to secure the corporate dashboard. We have intercepted the link to their staging login page. Your objective is to analyze the portal''s source code, bypass the flawed authentication token check, and recover the hidden agency flag.',
  'Portal Link',
  'https://savingsbank-neon.vercel.app/',
  'quest{PR3_PR0D_B4NK_BYP455}',
  ARRAY[]::text[],
  'Miscellaneous',
  'Easy',
  true
),
(
  'q1-photograph-remembers',
  'The Photograph That Remembers',
  'An old photograph was recovered from a damaged storage device. At first glance, there is nothing unusual about it. It looks like an ordinary photograph from a quiet evening at a café. But someone went to great lengths to hide something inside it. The photograph remembers more than it shows. Can you uncover what it remembers and recover the hidden flag?',
  'photo.jpg',
  '/challenges/media/photo.jpg',
  'quest{memories_hide_secrets}',
  ARRAY[]::text[],
  'Steganography',
  'Medium',
  true
),
(
  'q2-quiet-pixels',
  'Quiet Pixels',
  'A photograph was found on a seized laptop. It shows a famous landmark at dusk, and nothing in the file''s details gives anything away. But the investigators believe the image is carrying more than it shows. Whoever hid it left a decoy for anyone who looked too quickly. Find what the photograph is hiding, and use it to build the flag.',
  'quiet.png',
  '/challenges/media/quiet.png',
  'quest{0417_sanfrancisco_1937}',
  ARRAY['Quick scans don''t check everything.', 'Look beyond the obvious decoy — analyze color planes, LSB bitplanes, or trailing data.'],
  'Steganography',
  'Hard',
  true
),
(
  'q3-broken-broadcast',
  'Broken Broadcast',
  'A pirate radio station went silent last night. Four receivers across the city each recorded the broadcast, but every one of them caught only a fragment. On their own, the recordings sound like little more than static and a stray melody. Together, they say something. Piece the broadcast together and recover the flag. Warning: the files contain high-pitched hiss. Keep your volume low.',
  'radio_pieces.zip',
  '/challenges/media/radio_pieces.zip',
  'quest{four_pieces}',
  ARRAY[]::text[],
  'Steganography',
  'Medium',
  true
),
(
  'q4-snackbot-3000',
  'SnackBot 3000',
  'The campus vending machine, SnackBot 3000, has been handing out free snacks to someone all week. Security pulled its program off the machine for review. It only accepts one coupon code. Find out what it is.' || E'\n\n' || 'Included files: vending, maintenance_log.txt, run.sh' || E'\n' || 'Execution: bash run.sh',
  'snackbot3000.zip',
  '/challenges/media/snackbot3000.zip',
  'quest{sn4ck_h4ck3r}',
  ARRAY[]::text[],
  'Miscellaneous',
  'Medium',
  true
),
(
  'q5-invisible-ink',
  'Invisible Ink',
  'A recovered research report from Project LUMEN-4 was believed to be incomplete. The official records contain nothing unusual, but the final note left behind suggests otherwise:' || E'\n' || '“Do not trust the parts that were written for you.”' || E'\n' || '“Read the record again.”' || E'\n' || '“There is information here that was never meant to be recorded.”' || E'\n' || '“Look carefully.”' || E'\n' || 'A second file was recovered alongside the report, but it is password protected.' || E'\n' || 'Can you recover what was never meant to be recorded?',
  'lumen4_files.zip',
  '/challenges/media/lumen4_files.zip',
  'quest{invisible_words}',
  ARRAY[]::text[],
  'Cryptography',
  'Medium',
  true
),
(
  'q6-ghost-host',
  'Ghost Host',
  'A routine IT security memo was recovered during an internal audit. The memo appears ordinary, but one of its properties doesn''t quite agree with what''s visible on the page. Find what it''s hiding. Then follow it as far as it goes.',
  'internal_it_memo.docx',
  '/challenges/media/internal_it_memo.docx',
  'quest{ghost_git}',
  ARRAY[]::text[],
  'OSINT',
  'Medium',
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  file_name = EXCLUDED.file_name,
  file_path = EXCLUDED.file_path,
  correct_flag = EXCLUDED.correct_flag,
  hints = EXCLUDED.hints,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  is_active = true;

-- 2. Populate SHA-256 hashes in challenge_validations
CREATE TABLE IF NOT EXISTS public.challenge_validations (
  challenge_id text PRIMARY KEY,
  correct_flag_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.challenge_validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prevent public read of validations" ON public.challenge_validations;
CREATE POLICY "Prevent public read of validations"
  ON public.challenge_validations FOR SELECT
  USING (false);

INSERT INTO public.challenge_validations (challenge_id, correct_flag_hash)
SELECT id, encode(digest(correct_flag, 'sha256'), 'hex')
FROM public.challenges
ON CONFLICT (challenge_id) DO UPDATE SET
  correct_flag_hash = EXCLUDED.correct_flag_hash,
  updated_at = now();

-- 3. Advanced submit_flag RPC Function
-- Handles:
-- - Case-insensitive prefix (quest{...}, QUEST{...}, flag{...}, FLAG{...})
-- - Strictly case-sensitive inner content
-- - Zero mark deductions for hints
-- - Live session attempt tracking & instant leaderboard update
CREATE OR REPLACE FUNCTION public.submit_flag(
  p_challenge_id text,
  p_submitted_flag text,
  p_team_name text,
  p_time_spent integer,
  p_attempts integer,
  p_hints_used integer DEFAULT 0,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_stored_flag text;
  v_stored_hash text;
  v_submitted_trimmed text;
  v_prefix text;
  v_inner text;
  v_normalized_flag text;
  v_is_correct boolean := false;
  v_challenge record;
  v_points integer := 100;
BEGIN
  -- Fetch correct flag & hash
  SELECT correct_flag INTO v_stored_flag FROM public.challenges WHERE id = p_challenge_id;
  SELECT correct_flag_hash INTO v_stored_hash FROM public.challenge_validations WHERE challenge_id = p_challenge_id;

  IF v_stored_flag IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found');
  END IF;

  v_submitted_trimmed := trim(p_submitted_flag);

  -- 1. Exact match check (direct hash)
  IF encode(digest(v_submitted_trimmed, 'sha256'), 'hex') = v_stored_hash THEN
    v_is_correct := true;
  END IF;

  -- 2. Case-insensitive prefix normalization:
  -- lower(prefix) + case-sensitive inner content
  IF NOT v_is_correct AND v_submitted_trimmed ~ '^[a-zA-Z0-9_-]+\{.*\}$' THEN
    v_prefix := lower(substring(v_submitted_trimmed from '^([a-zA-Z0-9_-]+)\{'));
    v_inner := substring(v_submitted_trimmed from '^[a-zA-Z0-9_-]+\{(.*)\}$');
    v_normalized_flag := v_prefix || '{' || v_inner || '}';

    -- Check normalized prefix hash
    IF encode(digest(v_normalized_flag, 'sha256'), 'hex') = v_stored_hash THEN
      v_is_correct := true;
    END IF;

    -- Also check alternate prefix quest{inner} / CSC{inner} if applicable
    IF NOT v_is_correct THEN
      IF encode(digest('quest{' || v_inner || '}', 'sha256'), 'hex') = v_stored_hash OR
         encode(digest('flag{' || v_inner || '}', 'sha256'), 'hex') = v_stored_hash OR
         encode(digest('CSC{' || v_inner || '}', 'sha256'), 'hex') = v_stored_hash THEN
        v_is_correct := true;
      END IF;
    END IF;
  END IF;

  -- Handle Incorrect
  IF NOT v_is_correct THEN
    UPDATE public.challenge_sessions
    SET wrong_attempt_count = wrong_attempt_count + 1,
        time_spent = p_time_spent,
        last_activity = now()
    WHERE team_id = p_team_name AND challenge_id = p_challenge_id;

    RETURN jsonb_build_object('is_correct', false);
  END IF;

  -- Handle Correct: Determine points
  SELECT * INTO v_challenge FROM public.challenges WHERE id = p_challenge_id;
  IF v_challenge.difficulty = 'Medium' OR v_challenge.difficulty = 'Intermediate' THEN
    v_points := 200;
  ELSIF v_challenge.difficulty = 'Hard' OR v_challenge.difficulty = 'Advanced' THEN
    v_points := 300;
  ELSE
    v_points := 100;
  END IF;

  -- Insert solve into leaderboard (no hint mark deduction)
  INSERT INTO public.leaderboard (
    team_name, question_id, time_spent, attempts, hints_used, points, category, difficulty, idempotency_key, completed_at
  ) VALUES (
    p_team_name, p_challenge_id, p_time_spent, p_attempts, 0, v_points, v_challenge.category, v_challenge.difficulty, p_idempotency_key, now()
  )
  ON CONFLICT (team_name, question_id) DO NOTHING;

  -- Update challenge_sessions status
  UPDATE public.challenge_sessions
  SET is_completed = true,
      time_spent = p_time_spent,
      last_activity = now()
  WHERE team_id = p_team_name AND challenge_id = p_challenge_id;

  RETURN jsonb_build_object(
    'is_correct', true,
    'points', v_points,
    'message', 'Flag verified successfully!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
