import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withPracticeSchema } from "@/lib/practice-schema";

export const dynamic = "force-dynamic";

/* One of the signed-in student's own attempts, read by the embedded quiz app for review. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in to see this attempt." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const { id } = await context.params;

  try {
    const attempt = await withPracticeSchema(() => prisma.practiceAttempt.findUnique({
      where: { id },
      select: { userId: true, chapterId: true, chapterTitle: true, level: true, paper: true, entry: true, score: true, total: true, answers: true, createdAt: true }
    }));
    if (!attempt || (user.role !== "TEACHER" && attempt.userId !== user.id)) {
      return NextResponse.json({ ok: false, error: "Attempt not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(
      { ok: true, attempt: { ...attempt, userId: undefined, createdAt: attempt.createdAt.toISOString() } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not load the attempt." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
