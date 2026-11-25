-- CRM module tables (replaces in-memory mocks)

ALTER TABLE branch
  ADD COLUMN IF NOT EXISTS pricing_factor numeric NOT NULL DEFAULT 1;

ALTER TABLE org_member
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS display_color text DEFAULT '#3598CB',
  ADD COLUMN IF NOT EXISTS stats jsonb NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS catalog_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branch(id) ON DELETE SET NULL,
  item_type catalog_item_type NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  price int NOT NULL DEFAULT 0,
  duration_hours numeric,
  sku text,
  stock int,
  min_stock int,
  cost int,
  supplier text,
  unit text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalog_item_org_idx ON catalog_item(org_id);

CREATE TABLE IF NOT EXISTS appointment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
  staff_member_id uuid REFERENCES org_member(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customer(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  service_name text NOT NULL,
  catalog_item_id uuid REFERENCES catalog_item(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  duration_hours numeric NOT NULL DEFAULT 0.5,
  status appointment_status NOT NULL DEFAULT 'PENDING',
  price int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointment_org_branch_starts_idx ON appointment(org_id, branch_id, starts_at);

CREATE TABLE IF NOT EXISTS campaign (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  channel text NOT NULL,
  audience text NOT NULL,
  status campaign_status NOT NULL DEFAULT 'DRAFT',
  reach int NOT NULL DEFAULT 0,
  sent_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_org_idx ON campaign(org_id);

CREATE TABLE IF NOT EXISTS staff_invite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  added_by_id uuid NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  job_title text NOT NULL DEFAULT 'Staff',
  role org_role NOT NULL DEFAULT 'TEAM',
  branch_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);

CREATE INDEX IF NOT EXISTS staff_invite_org_idx ON staff_invite(org_id);