# Pathways Course Finder

Full-stack Next.js app for selecting a program + cycle and viewing courses.

## What we built
- Student view with tabs: program/cycle course list and course-code search.
- Admin login with Excel import (replaces DB contents).
- Admin course manager to edit course info plus semester/hours per cycle.(not working properly)

## Known limitations / not working yet
- Course title/code edits are global across all cycles (no per-cycle overrides).
- No admin UI to add/remove a course from a cycle (edit only).
- No production deployment instructions yet (local only in this README).

## Run locally (macOS)
1. Install Node.js (LTS) from https://nodejs.org.
2. Install PostgreSQL (recommended via Homebrew):

```
brew install postgresql@16
brew services start postgresql@16
```

3. Create the database and user:

```
psql postgres
```

Then in the psql prompt:

```
CREATE USER pathways_user WITH PASSWORD 'StrongPassword123!';
CREATE DATABASE pathways OWNER pathways_user;
GRANT ALL PRIVILEGES ON DATABASE pathways TO pathways_user;
```

4. Create a `.env` file in this folder:

```
DATABASE_URL="postgresql://pathways_user:StrongPassword123!@localhost:5432/pathways"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-string"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-this-password"
```

5. Install dependencies:

```
npm install
```

6. Generate Prisma client + run migrations:

```
npx prisma generate
npx prisma migrate dev --name init
```

7. Start the dev server:

```
npm run dev
```

Open http://localhost:3000.

## Import data
- Go to `/admin` and sign in with the admin credentials.
- Upload the Excel file. This replaces existing records.
