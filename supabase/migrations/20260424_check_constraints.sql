-- Contraintes CHECK sur les champs enum-like
-- NOT VALID = appliqué aux nouvelles lignes seulement (pas de scan rétroactif)

-- food_journal.meal : valeurs connues dans le codebase
alter table public.food_journal
  add constraint if not exists food_journal_meal_check
  check (meal in ('breakfast','lunch','snack','dinner'))
  not valid;

-- food_journal.source : valeurs connues (manual/plan) + scan/barcode pour extensions futures
alter table public.food_journal
  add constraint if not exists food_journal_source_check
  check (source in ('manual','plan','scan','barcode'))
  not valid;

-- progress_photos.photo_type : front/back/side
alter table public.progress_photos
  add constraint if not exists progress_photos_type_check
  check (photo_type in ('front','back','side'))
  not valid;

-- sport_sessions : kcal_total >= 0 si renseigné
alter table public.sport_sessions
  add constraint if not exists sport_sessions_kcal_check
  check (kcal_total is null or kcal_total >= 0)
  not valid;

-- weight_history : poids positif (déjà numeric(5,1) not null)
alter table public.weight_history
  add constraint if not exists weight_history_positive_check
  check (weight > 0)
  not valid;
