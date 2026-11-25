-- Lon CRM schema for Supabase (SQL Editor or CLI). Source of truth (Prisma removed).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE vertical AS ENUM ('SALON','RETAIL_STORE','DENTAL','TRAVEL','SPA','FITNESS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE org_role AS ENUM ('OWNER','MANAGER','TEAM','RECEPTIONIST','ACCOUNTANT','VIEWER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE catalog_item_type AS ENUM ('SERVICE','PRODUCT','PROCEDURE','PACKAGE','ADDON');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('CONFIRMED','IN_PROGRESS','COMPLETED','PENDING','NO_SHOW','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('DRAFT','SCHEDULED','SENT','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE platform_request_status AS ENUM ('PENDING','APPROVED','REJECTED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE platform_request_type AS ENUM ('NEW_BRANCH','VERTICAL_CHANGE','BILLING_PLAN','FEATURE_FLAG','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  vertical vertical NOT NULL,
  gstin text,
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name text NOT NULL,
  area text,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS branch_org_id_idx ON branch(org_id);

CREATE TABLE IF NOT EXISTS profile (
  id uuid PRIMARY KEY,
  phone text,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_member (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  role org_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, profile_id)
);

CREATE INDEX IF NOT EXISTS org_member_profile_id_idx ON org_member(profile_id);

CREATE TABLE IF NOT EXISTS org_member_branch (
  member_id uuid NOT NULL REFERENCES org_member(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, branch_id)
);

CREATE TABLE IF NOT EXISTS platform_request (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  requested_by_id uuid NOT NULL,
  type platform_request_type NOT NULL,
  title text NOT NULL,
  description text,
  payload jsonb NOT NULL DEFAULT '{}',
  status platform_request_status NOT NULL DEFAULT 'PENDING',
  reviewed_by text,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_request_org_status_idx ON platform_request(org_id, status);

-- CRM module tables (add as you migrate off mock data)
CREATE TABLE IF NOT EXISTS customer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branch(id),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  tier text NOT NULL DEFAULT 'New',
  visit_count int NOT NULL DEFAULT 0,
  lifetime_spend int NOT NULL DEFAULT 0,
  last_visit_at timestamptz,
  favourite_item text,
  loyalty_points int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, phone)
);

CREATE INDEX IF NOT EXISTS customer_org_id_idx ON customer(org_id);