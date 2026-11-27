import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withPracticeSchema } from "@/lib/practice-schema";
import { parseAttempt } from "@/lib/practice-attempts";
import { PRACTICE_ENTRIES } from "@/lib/quiz-access";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_BODY_BYTES = 128 * 1024;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to see your practice." }, { status: 401, headers: NO_STORE });

  try {
    // newest first, so the first row seen for a chapter is that chapter's latest attempt
    const rows = await withPracticeSchema(() => prisma.practiceAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 1500,
      select: { id: true, chapterId: true, answers: true }
    }));
    const latest: Record<string, { id: string; saved: unknown }> = {};
    for (const row of rows) {
      if (latest[row.chapterId]) continue;
      latest[row.chapterId] = { id: row.id, saved: row.answers };
    }
    return NextResponse.json({ ok: true, latest, count: rows.length }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not load attempts." }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ ok: false, error: "Sign in as a student to save your practice." }, { status: 401, headers: NO_STORE });
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "Attempt record is too large." }, { status: 413, headers: NO_STORE });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid attempt record." }, { status: 400, headers: NO_STORE });
  }
  const input = parseAttempt(body, PRACTICE_ENTRIES);
  if (!input) return NextResponse.json({ ok: false, error: "Invalid attempt record." }, { status: 400, headers: NO_STORE });

  try {
    const created = await withPracticeSchema(() => prisma.practiceAttempt.create({
      data: {
        userId: user.id,
        chapterId: input.chapterId,
        chapterTitle: input.chapterTitle,
        level: input.level,
        paper: input.paper,
        entry: input.entry,
        score: input.score,
        total: input.total,
        answers: input.saved as Prisma.InputJsonValue
      },
      select: { id: true, createdAt: true }
    }));
    return NextResponse.json({ ok: true, id: created.id }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not save the attempt." }, { status: 500, headers: NO_STORE });
  }
}
