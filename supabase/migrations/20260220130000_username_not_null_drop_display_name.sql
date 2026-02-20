-- Backfill any existing NULL usernames (shouldn't exist, but defensive)
UPDATE "Users"
SET username = lower(split_part(email, '@', 1))
WHERE username IS NULL;

-- Make username required
ALTER TABLE "Users" ALTER COLUMN username SET NOT NULL;

-- Drop display_name
ALTER TABLE "Users" DROP COLUMN IF EXISTS display_name;
