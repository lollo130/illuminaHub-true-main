/*
  # Creazione Tabella Notes con Row Level Security

  1. Tabella notes
  2. RLS abilitato: ogni utente vede/modifica SOLO le proprie note
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  subject text,
  type text,
  date text,
  status text DEFAULT 'Summarized',
  size text,
  content text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own notes') THEN
    CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own notes') THEN
    CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own notes') THEN
    CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own notes') THEN
    CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
