-- Local dev RLS bypass — safe to run on prod (no-op by default)
-- This app uses NextAuth (not Supabase Auth), so anon-key client-side queries
-- have no JWT claims. Prod uses getSupabaseAdminClient() (service role) which
-- bypasses RLS. This migration unblocks all anon reads/writes locally only.
--
-- Guard: policies are created ONLY when app.env is explicitly set to 'local'.
-- Opt-in, not opt-out — forgetting the flag is safe by default.
--
-- Local usage:  supabase db push --db-url "$LOCAL_URL" --set app.env=local
-- CI/prod:      supabase db push --db-url "$PROD_URL"   (no flag — skipped automatically)

DO $$
BEGIN
  -- Only create dev bypass policies when explicitly in local mode
  IF current_setting('app.env', true) != 'local' THEN
    RAISE NOTICE 'Skipping dev-only RLS policies (app.env != local)';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_local_dev' AND tablename = 'UserInternalizations' AND schemaname = 'public') THEN
    EXECUTE 'CREATE POLICY "anon_all_local_dev" ON public."UserInternalizations" FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_local_dev' AND tablename = 'UserArticleProgress' AND schemaname = 'public') THEN
    EXECUTE 'CREATE POLICY "anon_all_local_dev" ON public."UserArticleProgress" FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_local_dev' AND tablename = 'UserPracticeProgress' AND schemaname = 'public') THEN
    EXECUTE 'CREATE POLICY "anon_all_local_dev" ON public."UserPracticeProgress" FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_local_dev' AND tablename = 'TelemetryEvents' AND schemaname = 'public') THEN
    EXECUTE 'CREATE POLICY "anon_all_local_dev" ON public."TelemetryEvents" FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_local_dev' AND tablename = 'UserBookmarks' AND schemaname = 'public') THEN
    EXECUTE 'CREATE POLICY "anon_all_local_dev" ON public."UserBookmarks" FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_local_dev' AND tablename = 'UserConceptStats' AND schemaname = 'public') THEN
    EXECUTE 'CREATE POLICY "anon_all_local_dev" ON public."UserConceptStats" FOR ALL USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_all_local_dev' AND tablename = 'UserFeedback' AND schemaname = 'public') THEN
    EXECUTE 'CREATE POLICY "anon_all_local_dev" ON public."UserFeedback" FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;
