/*
  # Tabelle Exams e Lessons con Row Level Security
*/

-- ── EXAMS ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  professor text DEFAULT 'Da definire',
  cfu integer DEFAULT 6,
  target_grade integer DEFAULT 30,
  progress integer DEFAULT 0,
  status text DEFAULT 'Planning',
  date text,
  time text,
  location text,
  room text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own exams') THEN
    CREATE POLICY "Users can view own exams" ON exams FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own exams') THEN
    CREATE POLICY "Users can insert own exams" ON exams FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own exams') THEN
    CREATE POLICY "Users can update own exams" ON exams FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own exams') THEN
    CREATE POLICY "Users can delete own exams" ON exams FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── LESSONS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  room text DEFAULT 'Aula TBD',
  day integer NOT NULL,
  start_hour integer NOT NULL,
  duration integer DEFAULT 2,
  color text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own lessons') THEN
    CREATE POLICY "Users can view own lessons" ON lessons FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own lessons') THEN
    CREATE POLICY "Users can insert own lessons" ON lessons FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own lessons') THEN
    CREATE POLICY "Users can delete own lessons" ON lessons FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
