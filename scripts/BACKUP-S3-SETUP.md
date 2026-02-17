# Database backup to AWS S3 – setup guide

This guide walks you through creating an S3 bucket and IAM user so the backup script can upload dumps without using your personal AWS account keys.

---

## 1. Create an S3 bucket

1. Open [AWS Console → S3](https://s3.console.aws.amazon.com/s3/home).
2. Click **Create bucket**.
3. **Bucket name:** e.g. `your-name-supabase-db-backups` (must be globally unique).
4. **Region:** Pick one (e.g. `us-east-1`). Remember it for `AWS_REGION` later.
5. **Block Public Access:** Leave **all four** checkboxes enabled (no public access).
6. **Bucket Versioning:** Optional but recommended so you can recover from accidental overwrites.
7. Click **Create bucket**.

---

## 2. Create an IAM user for the backup script

1. Open [IAM → Users](https://console.aws.amazon.com/iam/home#/users).
2. Click **Create user**.
3. **User name:** e.g. `supabase-backup`.
4. Click **Next**.
5. **Permissions:** Choose **Attach policies directly**, then click **Create policy** (opens a new tab).

### In the policy editor (new tab)

- **Service:** S3.
- **Actions:** Under **Write**, select **PutObject** and **DeleteObject** (optional, for lifecycle/cleanup). Under **Read**, select **GetObject** and **ListBucket** (for verification).
- **Resources:** You must add **both** of these (bucket-level and object-level):
  - **Bucket:** `arn:aws:s3:::your-name-supabase-db-backups` (for ListBucket).
  - **Objects:** `arn:aws:s3:::your-name-supabase-db-backups/*` (required for PutObject, GetObject, DeleteObject — without `/*` uploads will fail with AccessDenied).
- **Create policy** and name it e.g. `SupabaseBackupS3`.

Return to the user creation tab, refresh the policy list, attach **SupabaseBackupS3**, then **Next** → **Create user**.

---

## 3. Create access keys for the IAM user

1. Open the user you just created → **Security credentials**.
2. **Access keys** → **Create access key**.
3. Use case: **Command Line Interface (CLI)** → Next → Create access key.
4. Copy the **Access key ID** and **Secret access key** once; you won’t see the secret again.

Configure the CLI (pick one):

**Option A – default profile**

```bash
aws configure
# Enter the Access key ID, Secret key, and region (e.g. us-east-1).
```

**Option B – named profile (recommended)**

```bash
aws configure --profile supabase-backup
# Enter the Access key ID, Secret key, and region.
```

If you use a named profile, set `AWS_PROFILE=supabase-backup` in `.env.local` (see below).

---

## 4. Get your Supabase database URL

1. [Supabase Dashboard](https://app.supabase.com) → your project.
2. **Project Settings** (gear) → **Database**.
3. Under **Connection string**, choose **URI**.
4. **Use the Session pooler** connection (not “Direct connection”). Copy the **Session pooler** string (port **5432**). It looks like:
   `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres`
   - Host must be `aws-0-<region>.pooler.supabase.com`, **not** `db.[ref].supabase.co`.
5. Replace `[YOUR-PASSWORD]` with your actual database password (from the same page if you need to reset it).

**If you see “could not translate host name” for `db.xxx.supabase.co`:** you’re using the Direct connection URL. Switch to the **Session pooler** tab and use that URI instead.

---

## 5. Configure the script (env vars)

Add these to `.env.local` in the **project root** (do **not** commit this file; it should be in `.gitignore`):

```bash
# Database backup to S3
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
S3_BACKUP_BUCKET=your-name-supabase-db-backups
# S3_BACKUP_PREFIX=   # optional; omit for bucket root
AWS_REGION=us-east-1
# If you use a named profile:
# AWS_PROFILE=supabase-backup
```

- **DATABASE_URL** – from step 4.
- **S3_BACKUP_BUCKET** – bucket name from step 1.
- **S3_BACKUP_PREFIX** – optional; set to a prefix (e.g. `db-backups/`) to use a folder, or omit for bucket root.
- **AWS_REGION** – bucket region from step 1.
- **AWS_PROFILE** – only if you used a named profile in step 3.

---

## 6. Run the backup

**Prerequisites:** PostgreSQL client tools (for `pg_dump`) and AWS CLI installed. **Supabase uses Postgres 17** — your `pg_dump` must be the same major version or newer, or you’ll get a “server version mismatch” error.

- **macOS (Homebrew):** `brew install postgresql@17 awscli` then run the script (it will use `postgresql@17`’s `pg_dump` if present). Or set `PG_DUMP=$(brew --prefix postgresql@17)/bin/pg_dump` in `.env.local`.
- **Ubuntu/Debian:** `sudo apt install postgresql-client-17 awscli` (or your distro’s package for Postgres 17 client).

Then:

```bash
chmod +x scripts/bin/backup-db-to-s3.sh
./scripts/bin/backup-db-to-s3.sh
```

Backups will appear in S3 at `s3://your-bucket/supabase-dump-YYYYMMDD-HHMMSS.dump.gz` (or under `S3_BACKUP_PREFIX` if set).

---

## Restoring from a backup

**Target:** Use a new Supabase project or an empty local Postgres database if you want a clean restore. Restoring over an existing DB can create duplicate or conflicting objects unless you drop them first.

1. Download the object from S3, e.g.:
   ```bash
   aws s3 cp s3://your-bucket/supabase-dump-20250217-120000.dump.gz ./
   gunzip supabase-dump-20250217-120000.dump.gz
   ```
2. Restore into a Postgres database (e.g. a new Supabase project or local Postgres). **Use `pg_restore` from Postgres 17** (same as the backup); older clients will error with “unsupported version (1.16) in file header”:
   ```bash
   # macOS with Homebrew postgresql@17:
   $(brew --prefix postgresql@17)/bin/pg_restore -d "postgresql://..." --no-owner --no-privileges supabase-dump-20250217-120000.dump
   ```
   To only list the dump contents (no restore): `$(brew --prefix postgresql@17)/bin/pg_restore --list file.dump`

---

## Optional: schedule with cron

The backup script loads `DATABASE_URL`, `S3_BACKUP_BUCKET`, etc. from the project’s `.env.local`, so cron only needs to run the script (no need to set env vars in crontab).

Cron runs with a minimal `PATH`, so include Homebrew so `brew` and `aws` are found (Apple Silicon: `/opt/homebrew/bin`, Intel: `/usr/local/bin`).

To run daily at 2 AM:

```bash
crontab -e
# Add (replace the path with your project root):
0 2 * * * PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" /Users/jamesperalta/Dev/personal-website/scripts/bin/backup-db-to-s3.sh >> /tmp/backup-db-s3.log 2>&1
```

### Test that cron runs the backup

**Quick check (recommended):** Run the backup with the same minimal `PATH` cron uses. If this succeeds, your crontab will work:

```bash
./scripts/bin/test-backup-as-cron.sh
```

**Or** confirm with a real cron run:

1. **Schedule a one-off run** a few minutes from now. Check the time, then add a temporary line:
   ```bash
   crontab -e
   # If it's 2:34 PM, run at 2:37 PM (minute 37, hour 14):
   37 14 * * * PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" /Users/jamesperalta/Dev/personal-website/scripts/bin/backup-db-to-s3.sh >> /tmp/backup-db-s3.log 2>&1
   ```
   Use the current date’s hour (24h) and a minute 3–5 minutes ahead.

2. **Wait** until that time has passed, then check the log:
   ```bash
   cat /tmp/backup-db-s3.log
   ```
   You should see “Creating logical backup…”, “Uploading to s3://…”, and “Done. Backup: s3://…”. If you see `command not found` for `pg_dump` or `aws`, cron’s `PATH` is missing them — use the `PATH=...` prefix in the cron line (as above).

3. **Confirm in S3** that a new object appeared (same date/time in the filename).

4. **Remove the test line** from crontab and keep only your daily schedule (e.g. `0 2 * * * ...`).

---

## Debugging S3 AccessDenied

If upload fails with **"not authorized to perform: s3:PutObject"**, the IAM user (e.g. `jamesperalta-dot-com-s3-backup`) is missing the right policy. Fix it like this:

### 1. Confirm which identity is in use

```bash
aws sts get-caller-identity
```

Note the **Arn** (e.g. `arn:aws:iam::354612239988:user/jamesperalta-dot-com-s3-backup`). Use that user in the next steps. If you use a named profile, run: `aws sts get-caller-identity --profile your-profile`.

### 2. Check the user’s policies

In **IAM → Users** → click your backup user → **Permissions** tab.

- **Policies attached directly:** You should see a policy that grants S3 access (e.g. `SupabaseBackupS3`). If there’s nothing here, attach one (step 3).
- If a policy is attached, open it and verify it has **PutObject** (and that the resource ARNs match your bucket).

### 3. Create or fix the policy

**Option A – Create a new policy (e.g. `SupabaseBackupS3`)**

1. **IAM → Policies → Create policy** → **JSON** tab.
2. Paste the following (replace `jamesperalta-dot-com-db-backup` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BackupBucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::jamesperalta-dot-com-db-backup",
        "arn:aws:s3:::jamesperalta-dot-com-db-backup/*"
      ]
    }
  ]
}
```

3. **Next** → name it (e.g. `SupabaseBackupS3`) → **Create policy**.
4. **IAM → Users** → your backup user → **Add permissions** → **Attach policies directly** → select the policy → **Add permissions**.

**Option B – Edit the existing policy**

If a policy is already attached but you still get AccessDenied on PutObject, the usual cause is **Resource** containing only the bucket ARN. Object operations (PutObject, GetObject, DeleteObject) require the object ARN too. Set **Resource** to an array with **both**:

- `arn:aws:s3:::YOUR-BUCKET-NAME`
- `arn:aws:s3:::YOUR-BUCKET-NAME/*`

Example: if you currently have `"Resource": "arn:aws:s3:::jamesperalta-dot-com-db-backup"`, change it to:

```json
"Resource": [
  "arn:aws:s3:::jamesperalta-dot-com-db-backup",
  "arn:aws:s3:::jamesperalta-dot-com-db-backup/*"
]
```

### 4. Retry the backup

```bash
./scripts/bin/backup-db-to-s3.sh
```

If it still fails, check for a **Permissions boundary** on the user (Users → user → Permissions boundary). It must allow the same S3 actions, or remove it for this user.

---

## Troubleshooting

**`could not translate host name "db.xxx.supabase.co" to address`**  
Your `DATABASE_URL` is using the **Direct** connection. Use the **Session pooler** URI instead: Supabase Dashboard → Project Settings → Database → Connection string → **Session** (not Direct). The host should be `aws-0-<region>.pooler.supabase.com`, and the user `postgres.[ref]`.

**`server version mismatch` / `aborting because of server version mismatch`**  
Supabase runs Postgres 17; your local `pg_dump` must be 17 or newer. On macOS: `brew install postgresql@17`. The script will use it automatically if found. Or set `PG_DUMP=$(brew --prefix postgresql@17)/bin/pg_dump` in `.env.local`.

**`AccessDenied` / `not authorized to perform: s3:PutObject`**  
The IAM user you’re using doesn’t have permission to upload to the bucket. See [Debugging S3 AccessDenied](#debugging-s3-accessdenied) below.
