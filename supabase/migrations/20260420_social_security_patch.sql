-- =====================================================================
-- SmartFitCoach — Social Security Patch (à exécuter après le schema initial)
-- Durcit sn_insert et ajoute rate limiting sur email lookup
-- =====================================================================

-- ── 1. FIX CRITIQUE : sn_insert — restreindre aux actions de l'utilisateur ──
-- Avant : WITH CHECK (TRUE) → n'importe qui peut spammer n'importe qui.
-- Après : l'actor_id doit être auth.uid() ET user_id (destinataire) doit être ami
--         ou être l'utilisateur lui-même (pour self-notifs système).
DROP POLICY IF EXISTS sn_insert ON social_notifications;
CREATE POLICY sn_insert ON social_notifications FOR INSERT TO authenticated
  WITH CHECK (
    -- L'émetteur doit être l'utilisateur authentifié
    (actor_id IS NULL OR actor_id = auth.uid())
    AND (
      -- Notif envoyée à soi-même (auto-notif système)
      user_id = auth.uid()
      -- OU notif envoyée à un ami accepté (likes/commentaires)
      OR are_friends(user_id, auth.uid())
      -- OU c'est une demande d'ami / acceptation (avant friendship active)
      OR type IN ('friend_request', 'friend_accepted')
    )
  );

-- ── 2. FIX : find_social_profile_by_email — rate limiting soft ──
-- On ne peut pas empêcher l'énumération côté Postgres pur sans extensions,
-- mais on peut :
--   a) Retourner uniquement si un profil social existe (pas juste auth.users)
--   b) Ajouter un delay artificiel via pg_sleep pour ralentir le scan
CREATE OR REPLACE FUNCTION find_social_profile_by_email(lookup_email TEXT)
RETURNS TABLE(id UUID, pseudo TEXT, avatar_color TEXT)
LANGUAGE PLPGSQL SECURITY DEFINER AS $$
DECLARE v_user_uuid UUID;
BEGIN
  -- Validation : email format basique
  IF lookup_email IS NULL OR length(lookup_email) < 3 OR position('@' IN lookup_email) = 0 THEN
    RETURN;
  END IF;

  -- Ralenti artificiellement les tentatives (50ms) pour limiter les scans
  PERFORM pg_sleep(0.05);

  -- Recherche uniquement dans les utilisateurs qui ont créé leur profil social
  -- (pas tous les comptes Supabase) — réduit la surface d'énumération
  SELECT sp.id INTO v_user_uuid
  FROM social_profiles sp
  JOIN auth.users au ON au.id = sp.id
  WHERE lower(au.email) = lower(trim(lookup_email))
  LIMIT 1;

  IF v_user_uuid IS NULL THEN RETURN; END IF;

  RETURN QUERY
    SELECT sp2.id, sp2.pseudo, sp2.avatar_color
    FROM social_profiles sp2 WHERE sp2.id = v_user_uuid;
END;
$$;

-- ── 3. CLEANUP : supprimer notifs pointant vers comments/posts deleted ──
-- Quand un post/commentaire est supprimé, les notifications associées restent.
-- Ajoute un trigger pour les nettoyer automatiquement.
CREATE OR REPLACE FUNCTION _sn_cleanup_on_post_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM social_notifications WHERE post_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS sn_cleanup_post ON feed_posts;
CREATE TRIGGER sn_cleanup_post
  BEFORE DELETE ON feed_posts
  FOR EACH ROW EXECUTE FUNCTION _sn_cleanup_on_post_delete();

-- ── 4. INDEX pour notifications (accès récent fréquent) ──
CREATE INDEX IF NOT EXISTS idx_sn_user_created
  ON social_notifications(user_id, created_at DESC);

-- ── FIN ──
-- Vérification : SELECT COUNT(*) FROM pg_policies WHERE tablename = 'social_notifications';
-- Doit retourner 4 (select, insert, update, delete)
