-- =============================================================================
-- 1. PASSWORD RESET REQUESTS TABLE
-- Allows participants who forgot password to submit a recovery request
-- Admins can view this table in Admin Dashboard or directly in Supabase
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

-- Anyone can submit a password reset request
DROP POLICY IF EXISTS "Anyone can submit password reset request" ON public.password_reset_requests;
CREATE POLICY "Anyone can submit password reset request" 
  ON public.password_reset_requests FOR INSERT WITH CHECK (true);

-- Admins and users can read
DROP POLICY IF EXISTS "Admins can view all reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins can view all reset requests" 
  ON public.password_reset_requests FOR SELECT USING (true);

-- Admins can update status/notes
DROP POLICY IF EXISTS "Admins can update reset requests" ON public.password_reset_requests;
CREATE POLICY "Admins can update reset requests" 
  ON public.password_reset_requests FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status ON public.password_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_email ON public.password_reset_requests(email);

-- =============================================================================
-- 2. QUALIFIED PARTICIPANTS DATA TABLE
-- Stores all participants and round 1 details
-- =============================================================================

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
CREATE POLICY "Allow public read access to participants" 
  ON public.participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin update to participants" ON public.participants;
CREATE POLICY "Allow admin update to participants" 
  ON public.participants FOR ALL USING (true);

-- Insert all 30 qualified participants from Round 1 PDF
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

-- Also sync allowed_emails so these can log in
INSERT INTO public.allowed_emails (email, team_name, leader_name, team_id)
SELECT email, team_name, leader_name, team_id FROM public.participants
ON CONFLICT (email) DO UPDATE SET
  team_name = EXCLUDED.team_name,
  leader_name = EXCLUDED.leader_name,
  team_id = EXCLUDED.team_id;
