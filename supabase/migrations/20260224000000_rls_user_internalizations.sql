-- Local dev RLS bypass (DO NOT apply to production)
-- This app uses NextAuth (not Supabase Auth), so anon-key client-side queries
-- have no JWT claims. Prod uses getSupabaseAdminClient() (service role) which
-- bypasses RLS. This migration unblocks all anon reads/writes locally.

CREATE POLICY "anon_all_local_dev" ON public."UserInternalizations" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_local_dev" ON public."UserArticleProgress"   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_local_dev" ON public."UserPracticeProgress"  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_local_dev" ON public."TelemetryEvents"       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_local_dev" ON public."UserBookmarks"         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_local_dev" ON public."UserConceptStats"      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_local_dev" ON public."UserFeedback"          FOR ALL USING (true) WITH CHECK (true);
