import { prisma } from "@/lib/db";

/* Tables behind the practice pages (PracticeAttempt, QuizGrant). They are created on first use
   with idempotent statements, the same way /api/setup creates the other tables, so deploying
   this feature needs no manual migration step. Nothing existing is altered. */

const statements = [
  `CREATE TABLE IF NOT EXISTS "PracticeAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "chapterTitle" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "paper" TEXT NOT NULL,
    "entry" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "answers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeAttempt_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE INDEX IF NOT EXISTS "PracticeAttempt_userId_createdAt_idx" ON "PracticeAttempt"("userId", "createdAt");`,
  `CREATE TABLE IF NOT EXISTS "QuizGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizGrant_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "QuizGrant_userId_itemKey_key" ON "QuizGrant"("userId", "itemKey");`,
  `DO $$ BEGIN
    ALTER TABLE "PracticeAttempt" ADD CONSTRAINT "PracticeAttempt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "QuizGrant" ADD CONSTRAINT "QuizGrant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`
];

let ensured: Promise<void> | null = null;

async function tablesExist() {
  const rows = (await prisma.$queryRaw`SELECT to_regclass('"PracticeAttempt"')::text AS practice, to_regclass('"QuizGrant"')::text AS grants`) as unknown as {
    practice: string | null;
    grants: string | null;
  }[];
  return rows.length > 0 && !!rows[0].practice && !!rows[0].grants;
}

export function ensurePracticeSchema(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      try {
        for (const statement of statements) {
          await prisma.$executeRawUnsafe(statement);
        }
      } catch (error) {
        // Two server instances may run the statements at the same moment; that is fine as long as
        // both tables are there afterwards. Anything else is reported to the caller.
        if (!(await tablesExist().catch(() => false))) throw error;
      }
    })().catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}

function isMissingTable(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  return code === "P2021" || code === "P2022";
}

/** Runs a query with the practice tables in place; rebuilds them and retries once if they have
    disappeared since this instance last checked. */
export async function withPracticeSchema<T>(run: () => Promise<T>): Promise<T> {
  await ensurePracticeSchema();
  try {
    return await run();
  } catch (error) {
    if (!isMissingTable(error)) throw error;
    ensured = null;
    await ensurePracticeSchema();
    return run();
  }
}
