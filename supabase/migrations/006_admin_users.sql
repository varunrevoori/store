-- Platform console: single role super_admin (replaces platform_operator).

DO $$ BEGIN
  CREATE TYPE console_admin_role AS ENUM ('super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES profile(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role console_admin_role NOT NULL DEFAULT 'super_admin',
  is_active boolean NOT NULL DEFAULT true,
  organization_id uuid REFERENCES organization(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES profile(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_users_active_idx ON admin_users(is_active) WHERE is_active = true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'platform_operator'
  ) THEN
    INSERT INTO admin_users (user_id, role, is_active, created_at, updated_at)
    SELECT po.profile_id, 'super_admin'::console_admin_role, po.is_active, po.created_at, po.updated_at
    FROM platform_operator po
    ON CONFLICT (user_id) DO UPDATE
      SET role = 'super_admin', is_active = EXCLUDED.is_active, updated_at = now();

    UPDATE admin_users au
    SET email = p.email, full_name = p.full_name
    FROM profile p
    WHERE au.user_id = p.id AND (au.email IS NULL OR au.full_name IS NULL);

    DROP TABLE platform_operator;
    DROP TYPE IF EXISTS platform_role;
  END IF;
END $$;