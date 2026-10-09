-- =============================================================================
-- CyberGauntlet - Email Whitelist for Round 1 Qualifiers
-- Auto-generated from teams_export_2026-10-09
-- =============================================================================

-- 1. Create the whitelist table
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  team_name text,
  leader_name text,
  team_id text,
  round_qualified text DEFAULT 'round_1',
  added_at timestamptz DEFAULT now()
);

-- RLS setup
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to allowed_emails" ON allowed_emails;
CREATE POLICY "Allow public read access to allowed_emails" 
  ON allowed_emails FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role to manage allowed_emails" ON allowed_emails;
CREATE POLICY "Allow service role to manage allowed_emails" 
  ON allowed_emails FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_allowed_emails_email ON allowed_emails(lower(email));

-- 2. Populate the table with the qualified teams from Round 1
INSERT INTO public.allowed_emails (email, team_name, leader_name, team_id) VALUES
  ('raghavarora930@gmail.com', 'HackerX', 'Raghav Arora', 'CH-D0895F'),
  ('vinay74sharmakush@gmail.com', 'Hello World!', 'Vinay Sharma', 'CH-033FAA'),
  ('shubh.2430010493@muj.manipal.edu', 'Onecrw', 'Shubh', 'CH-05224A'),
  ('ritikkushwah105@gmail.com', 'BitwiseBrains', 'Ritik kushwaha', 'CH-53F23F'),
  ('2025pceacspriya132@poornima.org', 'team lady bug', 'Priya singh', 'CH-5ECEAD'),
  ('ansh.2427030640@muj.manipal.edu', 'Seedhe code', 'Ansh Mishra', 'CH-AE4601'),
  ('vaibhavps3107@gmail.com', 'Dexter', 'Vaibhav pratap singh', 'CH-ACD016'),
  ('jeevesh.2602050673@muj.manipal.edu', '3 GPA', 'Jeevesh Shekhar', 'CH-24C86D'),
  ('arjun.2602050494@muj.manipal.edu', 'Superman', 'Arjun Atroley', 'CH-DF2B04'),
  ('khushi.2602051962@muj.manipal.edu', 'error not found', 'Khushi singh', 'CH-A25C4F'),
  ('2025pceacyharshal14@poornima.org', 'Team Sparx', 'Harshal Rajawat', 'CH-102B90'),
  ('eshika.2602052226@muj.manipal.edu', '404skillsnotfound', 'Eshika Atreya', 'CH-C13709'),
  ('ronit.2602052266@muj.manipal.edu', 'kuch bhi', 'Ronit', 'CH-50EEDD'),
  ('vedant.2502052333@muj.manipal.edu', 'team theta', 'Vedant Srivastava', 'CH-4928A1'),
  ('shuklavaibhav.work@gmail.com', '3BrainCells', 'Shukla Vaibhav', 'CH-63414C'),
  ('mehrotra.mishthi010@gmail.com', 'MAVS', 'Mishthi Mehrotra', 'CH-021ACE'),
  ('samruddharamekar@gmail.com', 'Attack On Cyber', 'Samruddha Ramekar', 'CH-F822E8'),
  ('sourav.singh2024@glbajajgroup.org', 'Styrustech', 'sourav singh', 'CH-52A3BE'),
  ('shaan.2602050595@muj.manipal.edu', '2 sutta 1 chai', 'Shaan Chawla', 'CH-EFB457'),
  ('prekshavijayvargiya12@gmail.com', 'bug off', 'Preksha Vijayvargiya', 'CH-9A1DC9'),
  ('nathagrima@gmail.com', 'LEVI''S', 'Agrima', 'CH-92EE8D'),
  ('artikushwaha55401@gmail.com', 'Beyond Aura', 'Arti', 'CH-19088E'),
  ('suhanisethiya1610@gmail.com', 'BYTEME', 'SUHANI', 'CH-E4CBA3'),
  ('arnav.2602052311@muj.manipal.edu', 'Lazarus', 'Arnav Rastogi', 'CH-91804D'),
  ('shailymt01@gmail.com', 'Barbie', 'Shaily Mani Tiwari', 'CH-3AE0D2'),
  ('atulya.2603080045@muj.manipal.edu', 'Devils', 'Atulya Kumar Sharma', 'CH-113A9E'),
  ('abhay701734@gmail.com', '777', 'Abhay Pratap Singh', 'CH-4F8371'),
  ('abc@gmail.com', 'Diamonds', 'Aditya', 'CH-8B37F1'),
  ('sarthakagrawal6244@gmail.com', 'Sa', 'Syrkn', 'CH-8E01F5'),
  ('alpha.sarthak6244@gmail.com', 'Sa', 'Sarthak', 'CH-8E01F5'),
  ('anvi.2427020706@muj.manipal.edu', 'Miniatures', 'Anvi Tiwari', 'CH-06E36D')
ON CONFLICT (email) DO UPDATE SET 
  team_name = EXCLUDED.team_name,
  leader_name = EXCLUDED.leader_name,
  team_id = EXCLUDED.team_id;

-- 3. Database Trigger: Deny signups if email is not on this list
CREATE OR REPLACE FUNCTION public.check_email_whitelist()
RETURNS TRIGGER AS $$
BEGIN
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

-- 4. Auto-create/populate Profile with Team Name & Leader Name upon registration
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_whitelist record;
BEGIN
  SELECT * INTO v_whitelist 
  FROM public.allowed_emails 
  WHERE lower(email) = lower(NEW.email) 
  LIMIT 1;

  INSERT INTO public.profiles (user_id, team_name, leader_name)
  VALUES (
    NEW.id,
    COALESCE(v_whitelist.team_name, NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(v_whitelist.leader_name, NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO UPDATE SET
    team_name = EXCLUDED.team_name,
    leader_name = EXCLUDED.leader_name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();
