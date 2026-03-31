# Pathways Deployment Handover (Neon + Vercel)

This document is production-only. It covers Neon database setup, Vercel deployment, Prisma migrations, and troubleshooting.

## 1) Production Architecture

- App hosting: Vercel
- Database: Neon (PostgreSQL)
- ORM/migrations: Prisma
- Auth: NextAuth credentials provider

## 2) Required Environment Variables (Vercel)

Set these in Vercel Project Settings -> Environment Variables for `Production`:

```env
DATABASE_URL=postgresql://...neon.../?sslmode=require
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strong-password
```

Rules:
- `DATABASE_URL` key must be exactly `DATABASE_URL`.
- Use Neon Postgres URL that starts with `postgresql://` or `postgres://`.
- `NEXTAUTH_URL` must be the deployed domain.

## 3) Neon Setup

1. Create a Neon project.
2. Create a database (or use default).
3. Copy the connection string.
4. Ensure SSL is enabled (`?sslmode=require` is present).
5. Save this value as `DATABASE_URL` in Vercel.

## 4) Vercel Deployment

### Git integration flow

1. Connect repository to Vercel.
2. Add all required environment variables.
3. Trigger deploy from Vercel.
4. Apply Prisma migrations to production DB (section 5).

### CLI flow (PowerShell)

```powershell
cd "C:\Users\Nash\Desktop\PathwaysDB\pathways-app"
npx vercel login
npx vercel link
npx vercel --prod
```

## 5) Production Migration Runbook (Required)

Run this every time there are schema changes.

1) Pull production env values:

```powershell
npx vercel env pull .env.vercel.prod --environment=production
```

2) Load production `DATABASE_URL` into shell:

```powershell
$line = Select-String -Path ".env.vercel.prod" -Pattern '^DATABASE_URL='
$env:DATABASE_URL = $line.Line.Split("=",2)[1].Trim('"')
```

3) Sanity check URL:

```powershell
$env:DATABASE_URL
```

4) Apply migrations:

```powershell
npx prisma migrate deploy
```

5) Redeploy app:

```powershell
npx vercel --prod
```

## 6) Post-Deploy Validation

- Open production URL.
- Login at `/admin/login`.
- Test an admin import upload.
- Confirm public search endpoints return data.

## 7) Troubleshooting

### `vercel` command not found

Use `npx vercel ...` commands, or install globally:

```powershell
npm i -g vercel
```

### `'$line' is not recognized`

You are in Command Prompt (`cmd`) but running PowerShell syntax.  
Open PowerShell and rerun the commands.

### Prisma `P1012` URL must start with `postgresql://` or `postgres://`

`DATABASE_URL` is missing/invalid.

Checks:
- Confirm `DATABASE_URL` exists in Vercel production env.
- Confirm `.env.vercel.prod` contains `DATABASE_URL=...`.
- Confirm it starts with `postgresql://` or `postgres://`.

### Prisma `P2021` table `ProgramCycleCourse` does not exist

Production migrations were not applied.

Fix:
- Run section 5 (`npx prisma migrate deploy` against production URL).
- Redeploy after migration.

### NextAuth login/session failures in production

Checks:
- `NEXTAUTH_URL` matches production domain exactly.
- `NEXTAUTH_SECRET` is set and non-empty.
- Redeploy after updating env vars.

## 8) Hosting and Database Alternatives

Primary recommendation remains Vercel + Neon. If needed, use one of these alternatives.

### Hosting alternatives to Vercel

- `Railway`: simple full-stack deployments with low setup overhead.
- `Render`: managed web services with straightforward configuration.
- `Fly.io`: better low-level runtime/region control.
- `AWS` (App Runner, ECS, Amplify): enterprise-grade control with higher ops overhead.

### Neon alternatives for PostgreSQL

- `Supabase Postgres`: managed Postgres with additional platform features.
- `Railway Postgres`: quick setup and simple developer workflow.
- `Render Postgres`: managed Postgres integrated with Render services.
- `AWS RDS PostgreSQL`: highly configurable, enterprise option.

### If switching hosting or database provider

1. Keep Prisma schema as-is unless provider-specific SQL is introduced.
2. Update production `DATABASE_URL` in hosting environment variables.
3. Run migrations:

```powershell
npx prisma migrate deploy
```

4. Redeploy app.
5. Validate login, admin import, and search endpoints.