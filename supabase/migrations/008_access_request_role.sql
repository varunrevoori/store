-- Role the applicant wants (manager, employee, etc.) — applied on superadmin approve.

ALTER TABLE access_request
  ADD COLUMN IF NOT EXISTS requested_role org_role;