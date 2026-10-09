-- =============================================================================
-- SQL TO INSERT ALL 6 REAL CHALLENGES FROM ctfcsc.vercel.app
-- Run this in your Supabase SQL Editor to sync database with the real challenges
-- =============================================================================

INSERT INTO public.challenges (id, title, description, file_name, file_path, correct_flag, hints, category, difficulty, is_active) VALUES
(
  'c1-dome-mirage',
  'Challenge 1: The Dome''s Mirage',
  '[SCENARIO] We intercepted visual data feeds originating from the dome building at Manipal University Jaipur. The operative attempted to exfiltrate a secure routing code, but the transmission was split into identical-looking layers to avoid detection. Find the mathematical difference between the image feeds to reveal the hidden matrix.',
  'stego_1 (1).png',
  '/challenges/media/stego_1 (1).png',
  'CSC{D0M3_M1R4G3_DIFF}',
  ARRAY['Inspect the subtle difference across color channels or layers.', 'Use mathematical image difference tools or Stegsolve.'],
  'Stego',
  'Intermediate',
  true
),
(
  'c2-ghs-frequency',
  'Challenge 2: GHS Frequency',
  '[SCENARIO] A field agent sent back this standard photograph of GHS before their communications were heavily jammed. While the image looks completely normal on the surface, our scanners are picking up a massive data anomaly trailing at the very end of the file''s binary structure. Extract the payload and decode the secure message. Be warned: the target''s transmission is not meant for your ears.',
  'stego_challenge (1).jpeg',
  '/challenges/media/stego_challenge (1).jpeg',
  'CSC{GH5_FR3QU3NCY_TR4C3}',
  ARRAY['Check the end of file (EOF) or file appending data.', 'Look for an embedded audio stream or sound spectrum hidden within.'],
  'Stego',
  'Advanced',
  true
),
(
  'c3-structural-trace',
  'Challenge 3: Structural Trace',
  '[SCENARIO] A suspicious video file was recovered from a compromised terminal in the administrative wing. The visual footage seems completely harmless, but the file size doesn''t quite add up. The attacker was careless and left a structural trace behind in the file''s properties. Analyze the video''s fingerprint to find the key, then dissect the file itself to pull out the hidden anomaly. Secure the flag before the data is lost.',
  'stego_challenge4.mp4',
  '/challenges/media/stego_challenge4.mp4',
  'CSC{5TRUCTUR4L_V1D30_TR4C3}',
  ARRAY['Check metadata and video tags for hidden passwords or hashes.', 'Carve out embedded zip or appended binary chunks from the mp4.'],
  'Forensics',
  'Advanced',
  true
),
(
  'c4-crests-secret',
  'Challenge 4: The Crest''s Secret',
  '[SCENARIO] Our college club recently distributed this official logo, but rumors are circulating that the executive committee hid a secret initiation code inside the file. At first glance, it looks like a standard high-quality crest. Basic forensics will give you a breadcrumb, but don''t be fooled—it''s a trap for amateurs. You will need to dig much deeper into the image to extract the true message. Can you bypass the lock and secure the flag?',
  'stego_challenge3.jpeg',
  '/challenges/media/stego_challenge3.jpeg',
  'CSC{CR35T_S3CR3T_K3Y}',
  ARRAY['Don''t stop at exiftool strings; examine hidden payloads inside.', 'Check steghide or password protected archives within.'],
  'Forensics',
  'Intermediate',
  true
),
(
  'c5-corrupted-drive',
  'Challenge 5: Corrupted Drive',
  '[SCENARIO] A ransomware attack hit the clinic''s local drive. We stopped the encryption process and managed to intercept the attacker''s extraction password: infected2026. However, this critical data file was partially corrupted during the attack, and the operating system doesn''t recognize the file type anymore. Repair the file''s header, restore it to its original format, and use the intercepted password to recover the flag inside.',
  'corrupted_patient_records.dat',
  '/challenges/media/corrupted_patient_records.dat',
  'CSC{C0RRUPT3D_F1L3_R3P41R}',
  ARRAY['Open in a Hex Editor and inspect the first magic bytes.', 'Determine the target archive header and repair the signature.', 'Extract with password: infected2026'],
  'Misc',
  'Advanced',
  true
),
(
  'c6-pre-production-panic',
  'Challenge 6: Pre-Production Panic',
  '[SCENARIO] The Central Savings Agency (CSA) rushed the deployment of their new employee portal and accidentally exposed a live staging environment. It appears their development team hasn''t connected the backend validation yet, relying entirely on exposed local browser scripts to secure the corporate dashboard. We have intercepted the link to their staging login page. Your objective is to analyze the portal''s source code, bypass the flawed authentication token check, and recover the hidden agency flag.',
  'Portal Link',
  'https://savingsbank-neon.vercel.app/',
  'CSC{PR3_PR0D_B4NK_BYP455}',
  ARRAY['Open DevTools (F12) -> Sources or inspect the client-side JavaScript.', 'Look at how tokens and login conditions are validated in the frontend code.'],
  'Web Exploitation',
  'Beginner',
  true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  file_name = EXCLUDED.file_name,
  file_path = EXCLUDED.file_path,
  hints = EXCLUDED.hints,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  is_active = true;

-- Update validation hashes (SHA-256)
INSERT INTO public.challenge_validations (challenge_id, correct_flag_hash)
SELECT id, encode(digest(correct_flag, 'sha256'), 'hex')
FROM public.challenges
ON CONFLICT (challenge_id) DO UPDATE SET
  correct_flag_hash = EXCLUDED.correct_flag_hash;
