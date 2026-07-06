-- First-party auth users (replaces Clerk SSO for interactive sign-in).
-- org_members.user_id (text) stores app_users.id, so tenancy is unchanged.

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  password_hash text,
  portal_role text NOT NULL DEFAULT 'ATHLETE',
  active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_unique ON app_users (email);
