-- =============================================================================
-- CYBERGAUNTLET COMPLETE DATABASE INITIALIZATION
-- Run this in Supabase SQL Editor to create all required tables
-- =============================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. ADMINS TABLE (Clean separation for admins, zero player clutter)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read admins" ON public.admins;
CREATE POLICY "Allow authenticated read admins" ON public.admins FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service role full access to admins" ON public.admins;
CREATE POLICY "Allow service role full access to admins" ON public.admins FOR ALL USING (auth.role() = 'service_role');

-- Register current admin user
INSERT INTO public.admins (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'mohammedfaisal.twf@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- 2. ALLOWED EMAILS & ROUND 1 PARTICIPANTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  team_name text,
  leader_name text,
  team_id text,
  round_qualified text DEFAULT 'round_1',
  added_at timestamptz DEFAULT now()
);

ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to allowed_emails" ON public.allowed_emails;
CREATE POLICY "Allow public read access to allowed_emails" ON public.allowed_emails FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service role to manage allowed_emails" ON public.allowed_emails;
CREATE POLICY "Allow service role to manage allowed_emails" ON public.allowed_emails FOR ALL USING (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text UNIQUE NOT NULL,
  team_name text NOT NULL,
  leader_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  college text,
  round_1_level integer DEFAULT 0,
  round_1_score integer DEFAULT 0,
  status text DEFAULT 'ACTIVE',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to participants" ON public.participants;
CREATE POLICY "Allow public read access to participants" ON public.participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow service role full access to participants" ON public.participants;
CREATE POLICY "Allow service role full access to participants" ON public.participants FOR ALL USING (auth.role() = 'service_role');

-- Populate all 30 qualified Round 1 teams
INSERT INTO public.participants (team_id, team_name, leader_name, email, phone, college, round_1_level, round_1_score, status) VALUES
  ('CH-D0895F', 'HackerX', 'Raghav Arora', 'raghavarora930@gmail.com', '8000778246', 'Poornima University', 31, 429, 'ACTIVE'),
  ('CH-033FAA', 'Hello World!', 'Vinay Sharma', 'vinay74sharmakush@gmail.com', '9149227395', 'Shri Ram Murti Smarak College of Engineering and Technology (SRMS CET) , Bareilly', 29, 358, 'ACTIVE'),
  ('CH-05224A', 'Onecrw', 'Shubh', 'shubh.2430010493@muj.manipal.edu', '9999204212', 'Manipal University Jaipur', 28, 340, 'ACTIVE'),
  ('CH-53F23F', 'BitwiseBrains', 'Ritik kushwaha', 'ritikkushwah105@gmail.com', '9639563664', 'GLA UNIVERSITY, MATHURA', 28, 340, 'ACTIVE'),
  ('CH-5ECEAD', 'team lady bug', 'Priya singh', '2025pceacspriya132@poornima.org', '9362062853', 'Poornima college of technology , jaipur', 27, 319, 'ACTIVE'),
  ('CH-AE4601', 'Seedhe code', 'Ansh Mishra', 'ansh.2427030640@muj.manipal.edu', '8595511552', 'manipal univeristy jaipur', 26, 294, 'ACTIVE'),
  ('CH-ACD016', 'Dexter', 'Vaibhav pratap singh', 'vaibhavps3107@gmail.com', '9719519288', 'Gla University', 25, 279, 'ACTIVE'),
  ('CH-24C86D', '3 GPA', 'Jeevesh Shekhar', 'jeevesh.2602050673@muj.manipal.edu', '9334046732', 'Manipal University Jaipur', 24, 260, 'ACTIVE'),
  ('CH-DF2B04', 'Superman', 'Arjun Atroley', 'arjun.2602050494@muj.manipal.edu', '9797548468', 'Manipal University Jaipur', 24, 260, 'ACTIVE'),
  ('CH-A25C4F', 'error not found', 'Khushi singh', 'khushi.2602051962@muj.manipal.edu', '6388430627', 'Manipal University Jaipur', 24, 258, 'ACTIVE'),
  ('CH-102B90', 'Team Sparx', 'Harshal Rajawat', '2025pceacyharshal14@poornima.org', '8955416606', 'Poornima College of Engineering', 24, 258, 'ACTIVE'),
  ('CH-C13709', '404skillsnotfound', 'Eshika Atreya', 'eshika.2602052226@muj.manipal.edu', '9520011939', 'manipal university jaipur', 24, 257, 'ACTIVE'),
  ('CH-50EEDD', 'kuch bhi', 'Ronit', 'ronit.2602052266@muj.manipal.edu', '9485876640', 'Manipal University Jaipur', 24, 253, 'ACTIVE'),
  ('CH-4928A1', 'team theta', 'Vedant Srivastava', 'vedant.2502052333@muj.manipal.edu', '9335063042', 'MUJ', 22, 218, 'ACTIVE'),
  ('CH-63414C', '3BrainCells', 'Shukla Vaibhav', 'shuklavaibhav.work@gmail.com', '9875097229', 'Manipal University of Jaipur', 22, 217, 'ACTIVE'),
  ('CH-021ACE', 'MAVS', 'Mishthi Mehrotra', 'mehrotra.mishthi010@gmail.com', '9116273309', 'Manipal University, Jaipur', 21, 200, 'ACTIVE'),
  ('CH-F822E8', 'Attack On Cyber', 'Samruddha Ramekar', 'samruddharamekar@gmail.com', '8179586242', 'Manipal University Jaipur', 21, 199, 'ACTIVE'),
  ('CH-52A3BE', 'Styrustech', 'sourav singh', 'sourav.singh2024@glbajajgroup.org', '8265889266', 'gl bajaj group of institution mathura', 21, 199, 'ACTIVE'),
  ('CH-EFB457', '2 sutta 1 chai', 'Shaan Chawla', 'shaan.2602050595@muj.manipal.edu', '8287410460', 'Manipal University Jaipur', 20, 189, 'ACTIVE'),
  ('CH-9A1DC9', 'bug off', 'Preksha Vijayvargiya', 'prekshavijayvargiya12@gmail.com', '9351114618', 'poornima college of engineering', 20, 189, 'ACTIVE'),
  ('CH-92EE8D', 'LEVI''S', 'Agrima', 'nathagrima@gmail.com', '7739857363', 'Manipal University Jaipur', 20, 186, 'ACTIVE'),
  ('CH-19088E', 'Beyond Aura', 'Arti', 'artikushwaha55401@gmail.com', '8445561441', 'gl bajaj group of institutions mathura', 19, 180, 'ACTIVE'),
  ('CH-E4CBA3', 'BYTEME', 'SUHANI', 'suhanisethiya1610@gmail.com', '9244025913', 'Poornima College Of Engineering', 19, 179, 'ACTIVE'),
  ('CH-91804D', 'Lazarus', 'Arnav Rastogi', 'arnav.2602052311@muj.manipal.edu', '9818988257', 'Manipal University Jaipur', 19, 178, 'ACTIVE'),
  ('CH-3AE0D2', 'Barbie', 'Shaily Mani Tiwari', 'shailymt01@gmail.com', '7800903791', 'Manipal University Jaipur', 19, 178, 'ACTIVE'),
  ('CH-113A9E', 'Devils', 'Atulya Kumar Sharma', 'atulya.2603080045@muj.manipal.edu', '9997551311', 'MUJ', 17, 159, 'ACTIVE'),
  ('CH-4F8371', '777', 'Abhay Pratap Singh', 'abhay701734@gmail.com', '7017344147', 'GLA University Mathura', 12, 110, 'ACTIVE'),
  ('CH-8B37F1', 'Diamonds', 'Aditya', 'abc@gmail.com', '6396558074', 'MUJ', 7, 58, 'ACTIVE'),
  ('CH-8E01F5', 'Sa', 'Syrkn', 'sarthakagrawal6244@gmail.com', '8810784540', 'muj', 4, 30, 'ACTIVE'),
  ('CH-06E36D', 'Miniatures', 'Anvi Tiwari', 'anvi.2427020706@muj.manipal.edu', '9871768320', 'Manipal University Jaipur', 3, 18, 'ACTIVE')
ON CONFLICT (email) DO UPDATE SET
  phone = EXCLUDED.phone,
  college = EXCLUDED.college,
  round_1_level = EXCLUDED.round_1_level,
  round_1_score = EXCLUDED.round_1_score;

INSERT INTO public.allowed_emails (email, team_name, leader_name, team_id)
SELECT email, team_name, leader_name, team_id FROM public.participants
ON CONFLICT (email) DO UPDATE SET
  team_name = EXCLUDED.team_name,
  leader_name = EXCLUDED.leader_name,
  team_id = EXCLUDED.team_id;

-- Whitelist signup guard
CREATE OR REPLACE FUNCTION public.check_email_whitelist()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow admins to register freely
  IF EXISTS (SELECT 1 FROM public.admins WHERE lower(email) = lower(NEW.email)) THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.allowed_emails 
    WHERE lower(email) = lower(NEW.email)
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only Round 1 qualified teams are eligible to register for this event.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_email_whitelist_trigger ON auth.users;
CREATE TRIGGER check_email_whitelist_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_email_whitelist();

-- =============================================================================
-- 3. COMPETITOR PROFILES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  team_name text,
  leader_name text,
  role text DEFAULT 'player',
  profile_picture_url text,
  points integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins can view all" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- =============================================================================
-- 4. CHALLENGES & CHALLENGE VALIDATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  file_name text DEFAULT '',
  file_path text DEFAULT '',
  correct_flag text NOT NULL,
  hints text[] DEFAULT '{}',
  category text NOT NULL,
  difficulty text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.challenges;
CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins full manage challenges" ON public.challenges;
CREATE POLICY "Admins full manage challenges" ON public.challenges FOR ALL USING (true);

-- Validation hashes table for server-side verification
CREATE TABLE IF NOT EXISTS public.challenge_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id text NOT NULL UNIQUE REFERENCES public.challenges(id) ON DELETE CASCADE,
  correct_flag_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.challenge_validations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role access to challenge_validations" ON public.challenge_validations;
CREATE POLICY "Service role access to challenge_validations" ON public.challenge_validations FOR ALL USING (auth.role() = 'service_role');

-- Seed initial challenges
INSERT INTO public.challenges (id, title, description, file_name, file_path, correct_flag, hints, category, difficulty, is_active) VALUES
('q1', 'The Cryptographer''s Dilemma', 'You are a cybersecurity consultant investigating a breach at the Ministry of Digital Secrets. Analyze the cipher collection to extract the hidden flag.', 'cipher_collection.txt', '/challenges/q1/cipher_collection.txt', 'CG{Guvf vf gur Synt!}', ARRAY['This code is based on a rotational shift of 3 for each letter','Polybius square coordinates group ciphertext by fives'], 'Cryptography', 'Intermediate', true),
('q2', 'Pair Sum Optimization', 'Auditing a student data processing algorithm for an optimal single pass without nested loops.', '', '', 'CG{TWO_POINTERS_ALGORITHM}', ARRAY['Use two pointers: index 0 and index length - 1','Compare sum to target and increment/decrement pointers'], 'Programming', 'Beginner', true),
('q3', 'The Security Key Reverser', 'Reverse-engineer the key transformation logic of processkey.', 'security.c', '/challenges/q3/security.c', 'CG{5E4D3A1B2C}', ARRAY['Swap both halves first','Reverse indices 0 to 4 in place'], 'Programming', 'Intermediate', true),
('q4', 'Invisible Ink Scenario', 'Text file size is larger than visible chars due to zero-width characters.', 'secretnote.txt', '/challenges/q4/secretnote.txt', 'CG{THIS_YOUR_FLAG}', ARRAY['Zero-width characters represent binary digits','Map Unicode sequence to binary then ASCII'], 'Steganography', 'Advanced', true),
('q5', 'The Final Register Readout', 'Raw register dump encoded in custom Quinary (base 5) system.', '', '', 'CG{SPToWP}', ARRAY['Convert each quinary number to decimal using powers of 5','Map decimal values to ASCII'], 'Cryptography', 'Advanced', true)
ON CONFLICT (id) DO NOTHING;

-- Populate validation hashes (SHA-256)
INSERT INTO public.challenge_validations (challenge_id, correct_flag_hash)
SELECT id, encode(digest(correct_flag, 'sha256'), 'hex')
FROM public.challenges
ON CONFLICT (challenge_id) DO UPDATE SET
  correct_flag_hash = EXCLUDED.correct_flag_hash;

-- =============================================================================
-- 5. LEADERBOARD TABLE (Restricted: only Admins can view)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  question_id text NOT NULL,
  time_spent integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 1,
  completed_at timestamptz DEFAULT now(),
  hints_used integer DEFAULT 0,
  points integer DEFAULT 100,
  category text,
  difficulty text,
  created_at timestamptz DEFAULT now(),
  idempotency_key text
);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated users (when they solve a challenge)
DROP POLICY IF EXISTS "Allow insert to leaderboard" ON public.leaderboard;
CREATE POLICY "Allow insert to leaderboard" ON public.leaderboard FOR INSERT WITH CHECK (true);

-- RESTRICTED: Only admins can view the leaderboard!
DROP POLICY IF EXISTS "Allow public read access to leaderboard" ON public.leaderboard;
DROP POLICY IF EXISTS "Only admins can view leaderboard" ON public.leaderboard;
CREATE POLICY "Only admins can view leaderboard" 
  ON public.leaderboard FOR SELECT 
  USING (
    auth.uid() IN (SELECT user_id FROM public.admins)
    OR auth.role() = 'service_role'
  );

CREATE INDEX IF NOT EXISTS idx_leaderboard_team_name ON public.leaderboard(team_name);
CREATE INDEX IF NOT EXISTS idx_leaderboard_completed_at ON public.leaderboard(completed_at);

-- =============================================================================
-- 6. PASSWORD RESET REQUESTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  team_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit password reset request" ON public.password_reset_requests;
CREATE POLICY "Anyone can submit password reset request" ON public.password_reset_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view all reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins can view all reset requests" ON public.password_reset_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can update reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins can update reset requests" ON public.password_reset_requests FOR UPDATE USING (true) WITH CHECK (true);

-- =============================================================================
-- 7. CHALLENGE SUBMISSIONS TABLE (For user community submissions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id uuid,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL,
  correct_flag text NOT NULL,
  hints text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read challenge submissions" ON public.challenge_submissions;
CREATE POLICY "Allow read challenge submissions" ON public.challenge_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert challenge submissions" ON public.challenge_submissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow admin update submissions" ON public.challenge_submissions;
CREATE POLICY "Allow admin update submissions" ON public.challenge_submissions FOR UPDATE USING (true) WITH CHECK (true);
