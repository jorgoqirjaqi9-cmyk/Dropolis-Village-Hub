# Dropolis — Backup & Restore Guide

## Overview

The Dropolis stack has two main data stores:

| Store | What it contains | Backup method |
|-------|-----------------|---------------|
| PostgreSQL (Replit managed) | Articles, villages, photos, videos, chat messages, submissions | `pg_dump` |
| Object Storage (Replit) | Uploaded photos, video thumbnails | `rclone` / API export |

---

## Required Environment Variables

```bash
DATABASE_URL          # PostgreSQL connection string (set by Replit automatically)
DEFAULT_OBJECT_STORAGE_BUCKET_ID  # Replit Object Storage bucket ID
PRIVATE_OBJECT_DIR    # Private object path prefix
PUBLIC_OBJECT_SEARCH_PATHS        # Public object path prefixes
ADMIN_API_KEY         # Admin API key for protected endpoints
RESEND_API_KEY        # Email notifications (Resend)
SESSION_SECRET        # Session signing secret
GEMINI_API_KEY        # Google Gemini AI (RSS translation, social posts)
FACEBOOK_PAGE_ACCESS_TOKEN        # Facebook page posting
CONTACT_EMAIL         # Contact form recipient
```

Keep a secure copy of all secrets in a password manager. **Never commit secrets to git.**

---

## Database Backup

### Manual backup (run from project root)

```bash
# Dump entire database to a compressed file
pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  -f "backup-dropolis-$(date +%Y%m%d-%H%M%S).dump"
```

### Restore from dump

```bash
# Drop and recreate the target DB first if needed, then:
pg_restore \
  --dbname="$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  backup-dropolis-YYYYMMDD-HHMMSS.dump
```

### What is backed up

The dump includes all tables:

| Table | Contents |
|-------|----------|
| `articles` | All news articles (published + drafts) |
| `villages` | Village directory with rich content |
| `photos` | Photo metadata (image files are in Object Storage) |
| `submitted_videos` | User-submitted video records |
| `videos` | YouTube video references |
| `chat_messages` | Community chat history |
| `news_submissions` | User news submissions (pending/approved/rejected) |
| `votes` | Article/photo votes |

### Automated backup (cron example)

```bash
# Add to crontab: backup every day at 03:00
0 3 * * * pg_dump "$DATABASE_URL" --format=custom --compress=9 --no-owner -f "/backups/dropolis-$(date +\%Y\%m\%d).dump" && find /backups -name "dropolis-*.dump" -mtime +30 -delete
```

---

## Object Storage Backup

Uploaded photos and video thumbnails are stored in Replit Object Storage. To export them:

### List all objects via API

```bash
curl -s "https://dropolis.net/api/storage/list" \
  -H "x-admin-api-key: $ADMIN_API_KEY" | jq .
```

### Download individual objects

```bash
# Objects are served publicly under /api/storage/
# Use the objectPath returned by the API to construct the URL
curl -O "https://dropolis.net/api/storage/<objectPath>"
```

### Bulk export with wget

```bash
# Get all public photo URLs from the DB:
psql "$DATABASE_URL" -c "\COPY (SELECT image_url FROM photos WHERE status='approved' AND image_url IS NOT NULL) TO STDOUT" \
  | wget -i - -P ./backup-photos/
```

---

## Schema Migrations to Production

Replit applies database schema changes automatically when you click **Publish**:

1. Replit diffs the dev schema against the production schema
2. Shows any renames for confirmation
3. Applies the SQL diff to production before the build runs

**Do not run `drizzle-kit push` against the production `DATABASE_URL` directly.**

To apply a new schema change:
1. Edit `lib/db/src/schema/` (Drizzle schema source of truth)
2. Apply to dev DB: `pnpm --filter @workspace/db run push`
3. Verify in development
4. Click **Publish** — Replit handles production migration automatically

---

## Environment Variable Backup

View all currently set env vars (names only, not values):

```bash
# Development environment:
# Check via Replit Secrets panel — all secrets prefixed with REPLIT_DB_ are auto-managed.
# The following must be set manually in production Secrets:
```

Required secrets checklist:

- [ ] `DATABASE_URL` — set automatically by Replit for managed databases
- [ ] `ADMIN_API_KEY` — set a strong random value (e.g. `openssl rand -hex 32`)
- [ ] `SESSION_SECRET` — set a strong random value (e.g. `openssl rand -hex 64`)
- [ ] `RESEND_API_KEY` — from resend.com dashboard
- [ ] `GEMINI_API_KEY` — from Google AI Studio
- [ ] `FACEBOOK_PAGE_ACCESS_TOKEN` — from Meta Developer Console
- [ ] `CONTACT_EMAIL` — email address for contact form notifications
- [ ] `DEFAULT_OBJECT_STORAGE_BUCKET_ID` — from Replit Object Storage panel
- [ ] `PRIVATE_OBJECT_DIR` — configured in Replit Object Storage settings
- [ ] `PUBLIC_OBJECT_SEARCH_PATHS` — configured in Replit Object Storage settings

---

## Full Restore Procedure

Use this when migrating to a new environment or recovering from data loss.

### Step 1 — Provision infrastructure

1. Create a new Replit project (or use existing)
2. Enable PostgreSQL database (Replit managed)
3. Enable Object Storage
4. Set all secrets in the Secrets panel

### Step 2 — Restore database

```bash
# Get the new DATABASE_URL from the Secrets panel, then:
pg_restore \
  --dbname="$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  backup-dropolis-YYYYMMDD-HHMMSS.dump
```

### Step 3 — Restore uploaded files

Re-upload photos and video thumbnails to the new Object Storage bucket:

```bash
# For each file saved during the Object Storage backup step:
# Upload via the admin API or directly via Replit Object Storage UI
```

### Step 4 — Deploy

1. Push code to the Replit project
2. Click **Publish**
3. Verify `https://dropolis.net/api/healthz` returns `{"status":"ok"}`
4. Verify `https://dropolis.net/api/articles` returns articles
5. Verify photos load correctly

---

## Health Check

After restoring, verify the deployment:

```bash
# API health
curl https://dropolis.net/api/healthz

# Article count
curl https://dropolis.net/api/stats

# Sitemap generation
curl https://dropolis.net/sitemap.xml | grep -c '<url>'
```

Expected responses:
- `/api/healthz` → `{"status":"ok"}`
- `/api/stats` → JSON with `articles`, `villages`, `photos` counts > 0
- `sitemap.xml` → 700+ `<url>` entries
