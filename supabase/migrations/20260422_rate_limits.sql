-- ============================================================
-- Rate limits table for ai-coach Netlify function
-- Rend le rate limiting persistant cross-instances (cold starts)
-- Exécuter dans Supabase > SQL Editor > Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip           TEXT        NOT NULL PRIMARY KEY,
  hour_count   INTEGER     NOT NULL DEFAULT 0,
  hour_reset_at TIMESTAMPTZ NOT NULL,
  day_count    INTEGER     NOT NULL DEFAULT 0,
  day_reset_at  TIMESTAMPTZ NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS activé : aucune policy publique → seul le service_role (fonctions Netlify) peut lire/écrire.
-- Les utilisateurs authentifiés et le client anon n'ont aucun accès.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Index pour les purges (suppression des lignes expirées)
CREATE INDEX IF NOT EXISTS rate_limits_updated_at_idx ON public.rate_limits (updated_at);

-- Nettoyage automatique des lignes de plus de 2 jours (pg_cron).
-- Si pg_cron n'est pas disponible sur votre plan, commentez ce bloc.
-- La table reste petite même sans (1 ligne par IP, ~100 bytes chacune).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-rate-limits',
      '0 3 * * *',
      $cron$DELETE FROM public.rate_limits WHERE updated_at < NOW() - INTERVAL '2 days'$cron$
    );
  END IF;
END
$$;
