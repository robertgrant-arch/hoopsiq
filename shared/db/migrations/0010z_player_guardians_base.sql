-- Backfill: player_guardians was created via drizzle-kit push in dev and has
-- no CREATE migration. Runs before 0011 (which alters it). Mirrors
-- shared/db/schema/guardians.ts.

DO $$ BEGIN
  CREATE TYPE guardian_relationship AS ENUM ('parent', 'stepparent', 'grandparent', 'guardian', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS player_guardians (
  id                   text PRIMARY KEY,
  org_id               text NOT NULL,
  player_id            text NOT NULL,
  guardian_user_id     text,
  name                 text NOT NULL,
  email                text,
  phone                text,
  relationship         guardian_relationship NOT NULL DEFAULT 'parent',
  is_primary           boolean NOT NULL DEFAULT false,
  can_receive_messages boolean NOT NULL DEFAULT true,
  created_at           timestamp NOT NULL DEFAULT now(),
  deleted_at           timestamp
);

CREATE INDEX IF NOT EXISTS player_guardians_player_idx ON player_guardians (player_id);
CREATE INDEX IF NOT EXISTS player_guardians_org_idx ON player_guardians (org_id);
