-- Public "request access" queue (reviewed in superadmin app, not self-signup).

DO $$ BEGIN
  CREATE TYPE access_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS access_request (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  company_name text,
  message text,
  status access_request_status NOT NULL DEFAULT 'PENDING',
  reviewed_by text,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS access_request_status_idx ON access_request(status);
CREATE UNIQUE INDEX IF NOT EXISTS access_request_email_pending_idx ON access_request (lower(email))
  WHERE status = 'PENDING';