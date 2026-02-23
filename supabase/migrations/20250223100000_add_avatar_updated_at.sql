-- Aggiungi campo per tracciare quando l'avatar viene aggiornato
-- Questo permette cache busting senza cambiare l'URL firmato ogni volta

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_updated_at timestamptz;

-- Aggiorna il timestamp per tutti gli avatar esistenti
UPDATE profiles
SET avatar_updated_at = NOW()
WHERE avatar_url IS NOT NULL;

-- Crea un trigger per aggiornare automaticamente avatar_updated_at quando avatar_url cambia
CREATE OR REPLACE FUNCTION update_avatar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
    NEW.avatar_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_avatar_timestamp ON profiles;

CREATE TRIGGER trigger_update_avatar_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_avatar_timestamp();
