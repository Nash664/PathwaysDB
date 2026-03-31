# Pathways App

Pathways is a web app for program and course lookup with an admin panel for uploading and managing academic data.  
The admin import uses Excel files and writes the data into PostgreSQL through Prisma.

## Stack

- Next.js 16
- TypeScript
- Prisma
- PostgreSQL
- NextAuth (credentials)

## Requirements

- Node.js LTS
- npm
- PostgreSQL 14+ (16 recommended)

## Setup

1) Clone the repository and open it:

```bash
cd pathways-app
```

2) Install dependencies:

```bash
npm install
```

3) Create `.env` in project root:

```env
DATABASE_URL=postgresql://pathways_user:ChangeThisPassword123!@localhost:5432/pathways
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strong-password
```

## PostgreSQL Local Configuration

Install PostgreSQL: [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)

Open SQL Shell (`psql`) and run:

```sql
CREATE USER pathways_user WITH PASSWORD 'ChangeThisPassword123!';
CREATE DATABASE pathways OWNER pathways_user;
GRANT ALL PRIVILEGES ON DATABASE pathways TO pathways_user;
```

## Run Locally

```bash
npx prisma migrate dev
npm run dev
```

Open:
- `http://localhost:3000`
- `http://localhost:3000/admin`

## Full Runbook

See [HANDOVER.md](./HANDOVER.md) for complete deployment, operations, and transfer documentation.
