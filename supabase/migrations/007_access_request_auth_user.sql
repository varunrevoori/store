-- Link access_request to auth user created at signup (password set on request form, no invite email).

ALTER TABLE access_request
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES profile(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS access_request_auth_user_id_idx ON access_request(auth_user_id);