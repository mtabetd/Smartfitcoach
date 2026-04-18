-- ============================================================
-- SMARTFITCOACH — Schema Supabase complet
-- Execute dans SQL Editor > Run (CTRL+Enter)
-- ============================================================

-- 1. PROFILES (le gros objet S, stocke en JSONB)
-- On ne normalise PAS les 100+ champs du profil.
-- On les stocke en JSONB exactement comme localStorage.
-- Avantage : zero migration quand tu ajoutes un champ cote JS.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  data jsonb not null default '{}',  -- tout le profil S (goal, sex, age, weight, sport*, muscu*, etc.)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. WEIGHT HISTORY (historique pesees — requetable pour graphiques)
create table public.weight_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight numeric(5,1) not null,  -- ex: 75.5
  created_at timestamptz not null default now(),
  unique(user_id, date)  -- 1 pesee par jour max
);

-- 3. SPORT SESSIONS (seances validees — duree, kcal, RPE)
create table public.sport_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  sport_type text,           -- 'musculation', 'crossfit', 'running', etc.
  day_index int,             -- index du jour dans le programme
  duration int,              -- minutes
  kcal_base int,
  kcal_epoc int,
  kcal_total int,
  rpe numeric(3,1),          -- ex: 7.5
  heart_rate int,
  data jsonb default '{}',   -- donnees supplementaires specifiques au sport
  created_at timestamptz not null default now()
);

-- 4. MUSCU SESSION LOGS (detail sets/reps/poids par exercice par jour)
create table public.muscu_session_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  exercise_name text not null,
  sets jsonb not null,       -- [{set:1, targetWeight:60, targetReps:10, actualWeight:60, actualReps:9, validated:true}, ...]
  created_at timestamptz not null default now(),
  unique(user_id, date, exercise_name)
);

-- 5. MUSCU PROGRESSION (historique long terme par exercice)
create table public.muscu_progression (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  date date not null,
  week int,
  weight numeric(5,1),       -- poids moyen (kg)
  reps int,                  -- reps moyennes
  created_at timestamptz not null default now(),
  unique(user_id, exercise_name, date)
);

-- 6. FOOD JOURNAL (journal alimentaire — 1 ligne par aliment)
create table public.food_journal (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  meal text not null,        -- 'breakfast', 'lunch', 'snack', 'dinner'
  name text not null,
  kcal int,
  protein numeric(5,1),
  carbs numeric(5,1),
  fat numeric(5,1),
  qty text,                  -- "150g", "2 oeufs", etc.
  time text,                 -- "08:30"
  source text default 'manual',  -- 'manual', 'plan', 'scan'
  created_at timestamptz not null default now()
);

-- 7. MEAL PLANS (plans nutritionnels hebdo — stocke en JSONB car structure complexe)
create table public.meal_plans (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,  -- lundi de la semaine
  plan jsonb not null,       -- le weekPlan complet (array de 7 jours)
  created_at timestamptz not null default now(),
  unique(user_id, week_start)
);

-- 8. WATER LOG (consommation eau par jour)
create table public.water_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  glasses int not null default 0,  -- verres de 250ml
  unique(user_id, date)
);

-- 9. SCAN HISTORY (produits scannes)
create table public.scan_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  brand text,
  barcode text,
  score int,
  kcal int,
  data jsonb default '{}',  -- donnees nutritionnelles completes
  scanned_at timestamptz not null default now()
);

-- 10. BADGES & GAMIFICATION
create table public.badges (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,    -- 'first_login', 'streak_7', etc.
  unlocked_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

create table public.streaks (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  best_streak int not null default 0,
  last_date date,
  dates jsonb default '[]',  -- array de dates
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table public.counters (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  counter_name text not null,  -- 'recipes_consulted', 'meals_swapped', etc.
  value int not null default 0,
  unique(user_id, counter_name)
);

-- 11. PERF HISTORY (historiques de performance — toutes disciplines)
create table public.perf_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,     -- 'muscu_weights', 'muscu_strength', 'cf_1rm', 'hyrox', 'triathlon', 'nutrition'
  date date not null,
  data jsonb not null,        -- {exercise:'bench', weight:60, reps:8, estimated1RM:68} etc.
  created_at timestamptz not null default now()
);

-- 12. PROGRESS PHOTOS (references — les fichiers vont dans Supabase Storage)
create table public.progress_photos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_type text not null,   -- 'front', 'back'
  date date not null,
  storage_path text not null, -- chemin dans Supabase Storage
  created_at timestamptz not null default now()
);


-- 13. EARLY REGISTRATIONS (pré-inscrits avant ouverture — gate.js / preregister function)
create table public.early_registrations (
  id bigint generated always as identity primary key,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- RLS : accessible uniquement via service key (fonction Netlify) — aucun accès client direct
alter table public.early_registrations enable row level security;
-- Pas de policy publique : seul le service role (bypass RLS) peut insérer


-- ============================================================
-- INDEX pour les requetes frequentes
-- ============================================================
create index idx_weight_history_user_date on public.weight_history(user_id, date desc);
create index idx_sport_sessions_user_date on public.sport_sessions(user_id, date desc);
create index idx_muscu_logs_user_date on public.muscu_session_logs(user_id, date desc);
create index idx_muscu_prog_user_ex on public.muscu_progression(user_id, exercise_name, date desc);
create index idx_food_journal_user_date on public.food_journal(user_id, date desc);
create index idx_perf_history_user_cat on public.perf_history(user_id, category, date desc);


-- ============================================================
-- ROW LEVEL SECURITY (chaque user ne voit que SES donnees)
-- ============================================================

-- Activer RLS sur toutes les tables
alter table public.profiles enable row level security;
alter table public.weight_history enable row level security;
alter table public.sport_sessions enable row level security;
alter table public.muscu_session_logs enable row level security;
alter table public.muscu_progression enable row level security;
alter table public.food_journal enable row level security;
alter table public.meal_plans enable row level security;
alter table public.water_log enable row level security;
alter table public.scan_history enable row level security;
alter table public.badges enable row level security;
alter table public.streaks enable row level security;
alter table public.counters enable row level security;
alter table public.perf_history enable row level security;
alter table public.progress_photos enable row level security;

-- Policies : chaque user peut lire/ecrire/modifier/supprimer SES propres donnees
-- Pattern : auth.uid() = user_id (ou id pour profiles)

-- profiles (cas special : id = auth.uid directement)
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Macro pour les autres tables (toutes ont user_id)
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'weight_history', 'sport_sessions', 'muscu_session_logs', 'muscu_progression',
    'food_journal', 'meal_plans', 'water_log', 'scan_history',
    'badges', 'streaks', 'counters', 'perf_history', 'progress_photos'
  ]) loop
    execute format('create policy "Users can view own %1$s" on public.%1$s for select using (auth.uid() = user_id)', t);
    execute format('create policy "Users can insert own %1$s" on public.%1$s for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "Users can update own %1$s" on public.%1$s for update using (auth.uid() = user_id)', t);
    execute format('create policy "Users can delete own %1$s" on public.%1$s for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;


-- ============================================================
-- TRIGGER : auto-update updated_at sur profiles
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();


-- ============================================================
-- TRIGGER : creer un profil vide a l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, data)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    '{}'::jsonb
  );
  -- Creer le streak initial
  insert into public.streaks (user_id, current_streak, best_streak)
  values (new.id, 0, 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- STORAGE BUCKET pour les photos de progression
-- ============================================================
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false);

-- Policy : chaque user peut upload/voir ses propres photos
create policy "Users can upload own photos"
  on storage.objects for insert
  with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own photos"
  on storage.objects for select
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own photos"
  on storage.objects for delete
  using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
