-- =====================================================================
-- SmartFitCoach — Projet 2.0 Phase A : Social Features Schema
-- À exécuter dans l'éditeur SQL de Supabase (une seule fois)
-- =====================================================================

-- ── 1. SOCIAL_PROFILES ──────────────────────────────────────────────
-- Profil public séparé du tableau `profiles` (données privées).
-- Ne contient que les informations partagées avec les amis.
CREATE TABLE IF NOT EXISTS social_profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudo       TEXT        NOT NULL,
  pseudo_lower TEXT        NOT NULL,
  avatar_color TEXT        NOT NULL DEFAULT '#C9A84C',
  sport_main   TEXT,
  sport_level  TEXT,
  bio          TEXT        CHECK (char_length(bio) <= 160),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pseudo_format CHECK (pseudo ~ '^[a-zA-Z0-9_-]{3,20}$'),
  CONSTRAINT pseudo_unique  UNIQUE (pseudo_lower)
);

-- Trigger : maintenir pseudo_lower à jour automatiquement
CREATE OR REPLACE FUNCTION _sp_set_pseudo_lower()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.pseudo_lower := lower(NEW.pseudo); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS sp_pseudo_lower ON social_profiles;
CREATE TRIGGER sp_pseudo_lower
  BEFORE INSERT OR UPDATE ON social_profiles
  FOR EACH ROW EXECUTE FUNCTION _sp_set_pseudo_lower();

-- Trigger : updated_at automatique
CREATE OR REPLACE FUNCTION _sp_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS sp_updated_at ON social_profiles;
CREATE TRIGGER sp_updated_at
  BEFORE UPDATE ON social_profiles
  FOR EACH ROW EXECUTE FUNCTION _sp_updated_at();

-- ── 2. FRIENDSHIPS ──────────────────────────────────────────────────
-- Relation bidirectionnelle : requester envoie une demande à addressee.
-- status: 'pending' | 'accepted' | 'blocked'
CREATE TABLE IF NOT EXISTS friendships (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID        NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  addressee_id UUID        NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_friend   CHECK (requester_id != addressee_id),
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

DROP TRIGGER IF EXISTS fs_updated_at ON friendships;
CREATE TRIGGER fs_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION _sp_updated_at();

-- ── 3. FEED_POSTS ───────────────────────────────────────────────────
-- Activités partagées au fil des amis.
-- type: 'workout' | 'pr' | 'challenge' | 'streak' | 'custom'
CREATE TABLE IF NOT EXISTS feed_posts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL
             CHECK (type IN ('workout', 'pr', 'challenge', 'streak', 'custom')),
  data       JSONB       NOT NULL DEFAULT '{}',
  is_shared  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. POST_REACTIONS (likes) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_reactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_reaction UNIQUE (post_id, user_id)
);

-- ── 5. POST_COMMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  text       TEXT        NOT NULL
             CHECK (char_length(text) >= 1 AND char_length(text) <= 500),
  deleted    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. SOCIAL_NOTIFICATIONS ─────────────────────────────────────────
-- Cloche in-app uniquement (pas de push dans Phase A).
-- type: 'like' | 'comment' | 'friend_request' | 'friend_accepted'
CREATE TABLE IF NOT EXISTS social_notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL
             CHECK (type IN ('like','comment','friend_request','friend_accepted')),
  actor_id   UUID        REFERENCES social_profiles(id) ON DELETE SET NULL,
  post_id    UUID        REFERENCES feed_posts(id) ON DELETE CASCADE,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fs_requester  ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_fs_addressee  ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_fs_status     ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_fp_user       ON feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_fp_created    ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pr_post       ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_pc_post       ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_sn_user_read  ON social_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_sp_pseudo     ON social_profiles(pseudo_lower);

-- ── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE social_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships           ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_notifications  ENABLE ROW LEVEL SECURITY;

-- Fonction helper : deux utilisateurs sont-ils amis (accepted) ?
CREATE OR REPLACE FUNCTION are_friends(user_a UUID, user_b UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND ((requester_id = user_a AND addressee_id = user_b)
        OR (requester_id = user_b AND addressee_id = user_a))
  );
$$;

-- Fonction helper : user_b est-il bloqué par user_a ?
CREATE OR REPLACE FUNCTION is_blocked_by(blocker UUID, blocked UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'blocked'
      AND requester_id = blocker
      AND addressee_id = blocked
  );
$$;

-- Fonction : trouver un profil social par email (lookup sécurisé, via auth.users)
-- Retourne (id, pseudo, avatar_color) sans exposer l'email directement.
CREATE OR REPLACE FUNCTION find_social_profile_by_email(lookup_email TEXT)
RETURNS TABLE(id UUID, pseudo TEXT, avatar_color TEXT)
LANGUAGE PLPGSQL SECURITY DEFINER AS $$
DECLARE found_id UUID;
BEGIN
  SELECT au.id INTO found_id FROM auth.users au
  WHERE lower(au.email) = lower(lookup_email) LIMIT 1;
  IF found_id IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT sp.id, sp.pseudo, sp.avatar_color
    FROM social_profiles sp WHERE sp.id = found_id;
END;
$$;

-- ── POLICIES : social_profiles ───────────────────────────────────────
DROP POLICY IF EXISTS sp_select ON social_profiles;
DROP POLICY IF EXISTS sp_insert ON social_profiles;
DROP POLICY IF EXISTS sp_update ON social_profiles;
DROP POLICY IF EXISTS sp_delete ON social_profiles;

-- Lecture : profil propre OU ami accepté
CREATE POLICY sp_select ON social_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR are_friends(id, auth.uid()));

CREATE POLICY sp_insert ON social_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY sp_update ON social_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY sp_delete ON social_profiles FOR DELETE TO authenticated
  USING (id = auth.uid());

-- ── POLICIES : friendships ───────────────────────────────────────────
DROP POLICY IF EXISTS fs_select ON friendships;
DROP POLICY IF EXISTS fs_insert ON friendships;
DROP POLICY IF EXISTS fs_update ON friendships;
DROP POLICY IF EXISTS fs_delete ON friendships;

CREATE POLICY fs_select ON friendships FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY fs_insert ON friendships FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND status = 'pending'
    AND NOT is_blocked_by(addressee_id, auth.uid())
  );

CREATE POLICY fs_update ON friendships FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY fs_delete ON friendships FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- ── POLICIES : feed_posts ────────────────────────────────────────────
DROP POLICY IF EXISTS fpo_select ON feed_posts;
DROP POLICY IF EXISTS fpo_insert ON feed_posts;
DROP POLICY IF EXISTS fpo_update ON feed_posts;
DROP POLICY IF EXISTS fpo_delete ON feed_posts;

CREATE POLICY fpo_select ON feed_posts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (is_shared = TRUE AND are_friends(user_id, auth.uid())));

CREATE POLICY fpo_insert ON feed_posts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY fpo_update ON feed_posts FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY fpo_delete ON feed_posts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── POLICIES : post_reactions ────────────────────────────────────────
DROP POLICY IF EXISTS pr_select ON post_reactions;
DROP POLICY IF EXISTS pr_insert ON post_reactions;
DROP POLICY IF EXISTS pr_delete ON post_reactions;

CREATE POLICY pr_select ON post_reactions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM feed_posts fp WHERE fp.id = post_id
      AND (fp.user_id = auth.uid() OR are_friends(fp.user_id, auth.uid()))
  ));

CREATE POLICY pr_insert ON post_reactions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM feed_posts fp WHERE fp.id = post_id
        AND (fp.user_id = auth.uid() OR are_friends(fp.user_id, auth.uid()))
    )
  );

CREATE POLICY pr_delete ON post_reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── POLICIES : post_comments ─────────────────────────────────────────
DROP POLICY IF EXISTS pc_select ON post_comments;
DROP POLICY IF EXISTS pc_insert ON post_comments;
DROP POLICY IF EXISTS pc_update ON post_comments;
DROP POLICY IF EXISTS pc_delete ON post_comments;

CREATE POLICY pc_select ON post_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM feed_posts fp WHERE fp.id = post_id
      AND (fp.user_id = auth.uid() OR are_friends(fp.user_id, auth.uid()))
  ));

CREATE POLICY pc_insert ON post_comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM feed_posts fp WHERE fp.id = post_id
        AND (fp.user_id = auth.uid() OR are_friends(fp.user_id, auth.uid()))
    )
  );

CREATE POLICY pc_update ON post_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY pc_delete ON post_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── POLICIES : social_notifications ─────────────────────────────────
DROP POLICY IF EXISTS sn_select ON social_notifications;
DROP POLICY IF EXISTS sn_insert ON social_notifications;
DROP POLICY IF EXISTS sn_update ON social_notifications;
DROP POLICY IF EXISTS sn_delete ON social_notifications;

CREATE POLICY sn_select ON social_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT ouvert aux utilisateurs authentifiés (le système insère les notifs d'autrui)
CREATE POLICY sn_insert ON social_notifications FOR INSERT TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY sn_update ON social_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY sn_delete ON social_notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── FIN ──────────────────────────────────────────────────────────────
-- Vérification : SELECT * FROM social_profiles LIMIT 1; doit retourner 0 lignes sans erreur.
