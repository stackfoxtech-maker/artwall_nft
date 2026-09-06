-- Run once in the Supabase SQL editor (or via psql as the postgres user).
-- Creates a least-privilege role for the Artwall app so a leaked connection
-- string cannot reach the other app's `public` tables or run DDL, and turns on
-- RLS as a backstop.
--
-- 1. Pick a strong password and replace <APP_DB_PASSWORD> below (and in .env).
-- 2. After running, point DATABASE_URL / DIRECT_URL at:
--      postgresql://artwall_app.<project-ref>:<APP_DB_PASSWORD>@<pooler-host>:6543/postgres?pgbouncer=true&schema=artwall
--    (Supabase → Connect shows the exact pooler host; keep the `.<project-ref>` suffix on the username.)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'artwall_app') THEN
    CREATE ROLE artwall_app LOGIN PASSWORD '<APP_DB_PASSWORD>'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END $$;

REVOKE ALL ON SCHEMA public FROM artwall_app;
GRANT USAGE ON SCHEMA artwall TO artwall_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA artwall TO artwall_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA artwall TO artwall_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA artwall
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO artwall_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA artwall
  GRANT USAGE, SELECT ON SEQUENCES TO artwall_app;

-- RLS backstop: the trusted app role passes; anon/authenticated have no policy,
-- so they are denied if this schema is ever exposed through PostgREST.
ALTER TABLE artwall."User"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwall."Collection"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwall."Certificate"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwall."RoyaltySplit" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_all ON artwall."User";
DROP POLICY IF EXISTS app_all ON artwall."Collection";
DROP POLICY IF EXISTS app_all ON artwall."Certificate";
DROP POLICY IF EXISTS app_all ON artwall."RoyaltySplit";
CREATE POLICY app_all ON artwall."User"         FOR ALL TO artwall_app USING (true) WITH CHECK (true);
CREATE POLICY app_all ON artwall."Collection"   FOR ALL TO artwall_app USING (true) WITH CHECK (true);
CREATE POLICY app_all ON artwall."Certificate"  FOR ALL TO artwall_app USING (true) WITH CHECK (true);
CREATE POLICY app_all ON artwall."RoyaltySplit" FOR ALL TO artwall_app USING (true) WITH CHECK (true);

-- DB-level integrity (previously only enforced in the API).
ALTER TABLE artwall."RoyaltySplit"
  DROP CONSTRAINT IF EXISTS royalty_bps_range,
  ADD CONSTRAINT royalty_bps_range CHECK ("basisPoints" BETWEEN 0 AND 10000);
