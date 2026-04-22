# Deployment — Admin & Subscription Security Hardening

**Scope:** moves subscription state from user-editable JSONB to
server-authoritative columns, and replaces the client-side SHA256 admin
gate with a Supabase login gated by `ADMIN_EMAILS` env var.

Nothing in this change takes effect automatically — you must run the SQL
migration and set two Netlify env vars. Until then, the new admin page
will show `ADMIN_EMAILS env var not set`, and the old JSONB-based
subscription read will keep working untouched.

## ⚠ CRITICAL — order matters

**Step 1 (SQL migration) MUST run BEFORE Step 2 (Netlify deploy).** If
you ship the new `admin-list-users` function against a pre-migration
database, the `subscription_plan` / `subscription_end` columns do not
exist yet and the function returns a 500 with a "column missing" error
— the admin UI will not load. Conversely, if the migration lands but
the old client bundle is still cached on user tabs, those old tabs can
keep writing `subscriptionPlan` into the JSONB; the new trigger strips
it immediately, so there's no bypass, but you may see console warnings
in users' tabs until they refresh.

---

## 1. Supabase — run the migration

Open the Supabase SQL Editor on your production project and paste the
`SUBSCRIPTION — SERVER-AUTHORITATIVE (2026-04)` block from
`supabase-schema.sql` (bottom of the file). Press **Run**.

The migration:
- Adds two columns: `profiles.subscription_plan` (text) and
  `profiles.subscription_end` (date).
- Backfills them from the existing `data->>'subscriptionPlan'` /
  `data->>'subscriptionEnd'` values (idempotent — safe to rerun).
- Replaces the profile UPDATE policy so a user's own UPDATE can change
  anything EXCEPT those two columns.
- Installs a `BEFORE INSERT OR UPDATE` trigger that strips
  `subscriptionPlan` / `subscriptionEnd` from any JSONB payload written
  by a non-service-role caller. Defense-in-depth if a client forgets to
  sanitize.

Verify the migration succeeded:

```sql
select id, subscription_plan, subscription_end
  from public.profiles
 order by updated_at desc
 limit 5;
```

You should see values mirroring what was in `data->>'subscriptionPlan'`.

Verify the trigger rejects user tampering (log in as a real user in the
SQL editor via "Run as user"):

```sql
update public.profiles
   set data = jsonb_set(data, '{subscriptionPlan}', '"unlimited"')
 where id = auth.uid();
select data ? 'subscriptionPlan' from public.profiles where id = auth.uid();
-- expected: false (trigger stripped the key)
```

---

## 2. Netlify — set env vars

Dashboard → Site settings → Environment variables:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | already set (used by `delete-account.js`) |
| `SUPABASE_SERVICE_ROLE_KEY` | already set (used by `delete-account.js`) |
| `ADMIN_EMAILS` | **NEW** — comma-separated list of admin emails, e.g. `you@example.com,ops@example.com` |

Then trigger a redeploy (or wait for the next commit) so the new
functions (`_admin-auth.js`, `admin-list-users.js`,
`admin-update-subscription.js`) pick up the env vars.

---

## 3. Ensure your admin email has a Supabase account

The admin gate is a real Supabase login — your email must exist in
`auth.users` with a known password. If it does not:

Supabase Dashboard → Authentication → Users → **Add user** → enter the
same email you put in `ADMIN_EMAILS`, set a password.

If your personal Supabase auth row has no profile row yet, that's fine —
`admin-list-users` uses the service role and doesn't need a profile for
the admin themselves.

---

## 4. Smoke test (deploy preview first)

Push the branch to a Netlify deploy preview (the origin
`*--smartfitcoach.netlify.app` is already allow-listed). Open
`<preview-url>/admin.html` and:

1. Log in with an email **not** in `ADMIN_EMAILS`. You should see:
   > « Ce compte n'est pas déclaré admin. Ajoutez-le à ADMIN_EMAILS dans Netlify. »
2. Log in with an admin email. The user table loads.
3. Click **Gérer** on any user, change the plan, save. Network tab
   shows `POST /.netlify/functions/admin-update-subscription` with a
   200 response.
4. In DevTools on the main app, as a regular user, try to self-grant
   unlimited via `supabase.from('profiles').update({data:{subscriptionPlan:'unlimited'}}).eq('id','<self-uid>')`.
   The update returns success (RLS allows it) but selecting back shows
   the trigger stripped the key. `isPremium()` still returns `false`.

---

## 5. Rollback (< 5 min)

**Fastest — revert the deploy:** Netlify Dashboard → Deploys → pick the
previous deploy → **Publish deploy**. The old SHA256-gate admin.html
comes back immediately. The SQL migration is additive and can stay — it
hurts nothing.

**If you want to undo the SQL too:** run the following in the Supabase
SQL Editor. The columns stay (harmless), only the policy and trigger
revert:

```sql
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop trigger if exists profiles_strip_sub_keys on public.profiles;
drop function if exists public.profiles_strip_subscription_keys();
```

After that, direct JSONB writes of `subscriptionPlan` start working
again for users (which is the old behavior).

---

## 6. Risk checklist

- `ADMIN_EMAILS` typo / case mismatch → admin gets 403. The helper
  lowercases + trims, but double-check no trailing whitespace.
- Forgetting `SUPABASE_SERVICE_ROLE_KEY` → functions return 500 with
  a clear message (`Server misconfigured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)`).
- Trigger firing for service_role → if PostgREST forwards the role as
  something other than `service_role` in `request.jwt.claim.role`, the
  allowlist `coalesce(...,'') <> 'service_role'` blocks admin writes.
  The admin function uses the dedicated columns (not JSONB), so the
  trigger has no effect on it — but verify with a manual
  `admin-update-subscription` call before closing out the migration.
- Token leaks → all error responses use short fixed strings; no
  `err.stack` is ever returned. Never `console.log` the service key.
