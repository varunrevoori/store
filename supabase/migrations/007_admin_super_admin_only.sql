-- If 006 was already applied with extra enum values, normalize to super_admin only in data.

UPDATE admin_users
SET role = 'super_admin', updated_at = now()
WHERE role::text IS DISTINCT FROM 'super_admin';