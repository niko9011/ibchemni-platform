import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withPracticeSchema } from "@/lib/practice-schema";
import { isPracticeEntry } from "@/lib/quiz-access";
import { LEVEL_NAMES, PAPER_NAMES, chinaTime, marksText, percentText } from "@/lib/practice-summary";

export const dynamic = "force-dynamic";

/* Read-only replay of one of the student's own attempts: the page shows the result, the embedded
   quiz app loads the saved answers (its own /api/practice/attempts/<id> check). */
export default async function PracticeReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const attempt = await withPracticeSchema(() => prisma.practiceAttempt.findUnique({
    where: { id },
    select: { id: true, userId: true, chapterTitle: true, level: true, paper: true, entry: true, score: true, total: true, createdAt: true }
  }));
  if (!attempt || (user.role !== "TEACHER" && attempt.userId !== user.id)) notFound();

  const entry = isPracticeEntry(attempt.entry) ? attempt.entry : "topical-units";
  const quizSrc = `/ib-quiz-platform/index.html?entry=${entry}&review=${encodeURIComponent(attempt.id)}`;

  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-5 sm:py-10">
      <div className="mb-4 flex flex-col gap-3 px-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">My practice record</p>
          <h1 className="mobile-title mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{attempt.chapterTitle}</h1>
          <p className="mt-2 text-sm text-muted">
            {LEVEL_NAMES[attempt.level] || attempt.level} · {PAPER_NAMES[attempt.paper] || attempt.paper} · {chinaTime(attempt.createdAt)} ·{" "}
            <span className="font-bold text-ink">{marksText(attempt.score, attempt.total)} ({percentText(attempt.score, attempt.total)})</span>
          </p>
        </div>
        <Link href="/my-practice" className="text-sm font-bold text-blue">← Back to my practice record</Link>
      </div>
      <iframe
        title="Review attempt"
        src={quizSrc}
        className="h-[calc(100vh-220px)] min-h-[760px] w-full rounded-[1.5rem] border border-blue/10 bg-white"
      />
    </main>
  );
}
