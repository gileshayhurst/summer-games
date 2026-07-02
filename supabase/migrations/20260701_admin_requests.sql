-- A member can ask the group owner to promote them to admin. NULL = no
-- pending request. Set = pending. Cleared back to NULL on approve or deny
-- (approve also sets role = 'admin' in the same update).
ALTER TABLE group_members ADD COLUMN admin_requested_at TIMESTAMPTZ;
