-- =====================================================================
-- SmartFitCoach — Avatar URL column (photo de profil optionnelle)
-- À exécuter après 20260419_social_schema.sql et 20260420_social_security_patch.sql
-- =====================================================================

-- Ajoute colonne avatar_url : URL data-URL base64 d'un thumbnail carré (max ~15KB)
-- Optionnel — si NULL, avatar affiche initiales + couleur (fallback)
ALTER TABLE social_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Pas de contrainte taille côté DB (JSON/base64 peut monter jusqu'à 1MB
-- technique, mais l'app limite à ~20KB via thumbnail)

-- Vérification : SELECT column_name FROM information_schema.columns
--                WHERE table_name='social_profiles';
