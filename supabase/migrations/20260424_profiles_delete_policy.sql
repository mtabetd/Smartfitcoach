-- RGPD: allow users to delete their own profile row
-- The profiles table had SELECT/INSERT/UPDATE policies but no DELETE.
-- All child tables already cascade-delete via auth.users(id) ON DELETE CASCADE.
create policy if not exists "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);
