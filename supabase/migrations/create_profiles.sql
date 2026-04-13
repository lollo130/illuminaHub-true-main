/*
      # Creazione Tabella Profili Utente

      1. Nuove Tabelle
        - `profiles`
          - `id` (uuid, chiave primaria, riferita a auth.users)
          - `nickname` (text, unico)
          - `avatar_url` (text)
          - `updated_at` (timestamp)
      2. Sicurezza
        - Abilita RLS su `profiles`
        - Politiche per lettura e gestione del proprio profilo
    */

    CREATE TABLE IF NOT EXISTS profiles (
      id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
      nickname text UNIQUE,
      avatar_url text,
      updated_at timestamptz DEFAULT now()
    );

    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
      END IF;
    END $$;
