# IB chem Ni Platform App

This is the real login and manual access version of the IB chem Ni learning platform.

## What This Version Does

- Student login with email and password
- Teacher login
- Teacher creates student accounts
- Teacher manually opens or closes access to a specific SL / HL chapter
- Student dashboard only shows unlocked chapters
- Product pages show section videos, blank handouts, completed handouts, and chapter resources

## First Version Flow

1. Student pays offline.
2. Student sends name and email to IB chem Ni.
3. Teacher creates the student account in `/admin`.
4. Teacher selects the purchased chapter and opens access.
5. Student logs in at `/login`.
6. Student sees only unlocked chapters.

## Setup

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env`.
3. Fill in:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/ibchemni"
SESSION_SECRET="replace-with-a-long-random-secret"
TEACHER_EMAIL="ibchemistryni@163.com"
TEACHER_PASSWORD="change-this-password"
SETUP_TOKEN="replace-with-a-private-setup-token"
```

4. Install dependencies:

```bash
npm install
```

5. Create database tables locally:

```bash
npm run prisma:migrate
```

6. Seed the teacher account and all SL / HL chapter products:

```bash
npm run prisma:seed
```

7. Run locally:

```bash
npm run dev
```

## Storage Plan

- Videos: Tencent Cloud VOD
- PDFs: Tencent Cloud COS
- Website database stores only secure VOD IDs and protected file references

## Important

The old Netlify static website cannot truly protect paid resources by itself. This app requires deployment as a Next.js backend application with a real database.

For production deployment, read `DEPLOYMENT-CN.md`.
