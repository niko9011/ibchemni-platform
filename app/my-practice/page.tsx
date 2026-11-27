import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withPracticeSchema } from "@/lib/practice-schema";
import { ATTEMPT_SELECT, LEVEL_NAMES, PAPER_NAMES, chinaTime, marksText, percentText, summarizeByChapter } from "@/lib/practice-summary";

export const dynamic = "force-dynamic";
export const metadata = { title: "My practice record | IB chem Ni" };

export default async function MyPracticePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "TEACHER") redirect("/admin");

  const attempts = await withPracticeSchema(() => prisma.practiceAttempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: ATTEMPT_SELECT
  }));
  const chapters = summarizeByChapter(attempts);
  const earned = attempts.reduce((sum, row) => sum + row.score, 0);
  const possible = attempts.reduce((sum, row) => sum + row.total, 0);
  const last = attempts[0] || null;

  const tile = (label: string, value: string, hint: string) => (
    <div className="rounded-[2rem] card p-6">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </div>
  );

  const scoreCell = (score: number, total: number) => (
    <span className="font-semibold text-ink">
      {marksText(score, total)} <span className="ml-1 text-xs font-normal text-muted">{percentText(score, total)}</span>
    </span>
  );

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Student Dashboard</p>
          <h1 className="mobile-title mt-2 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">My practice record</h1>
          <p className="mt-4 text-muted">Every set you finish is kept here. Reopen any attempt to see your answers next to the correct ones.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="min-h-12 rounded-full border border-blue/20 bg-white px-5 py-3 text-sm font-bold text-muted">My chapters</Link>
          <Link href="/topical" className="min-h-12 rounded-full bg-blue px-5 py-3 text-sm font-bold text-white">Practise</Link>
        </div>
      </div>

      <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {tile("Attempts", String(attempts.length), "Finished sets on record")}
        {tile("Chapters practised", String(chapters.length), "Different sets attempted")}
        {tile("Marks", marksText(earned, possible), `${percentText(earned, possible)} of all marks entered so far`)}
        {tile("Last practised", last ? chinaTime(last.createdAt) : "–", "China time")}
      </section>

      {attempts.length === 0 ? (
        <section className="mt-10 rounded-[2rem] card p-8 text-center">
          <h2 className="text-2xl font-semibold text-ink">Nothing practised yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
            Open Topical by Chapter to practise the chapters unlocked for your account, or the full past papers and Exam Sprint sets.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/topical" className="min-h-12 rounded-full bg-blue px-6 py-3 text-sm font-bold text-white">Topical by Chapter</Link>
            <Link href="/past-paper-sets" className="min-h-12 rounded-full border border-blue/20 bg-white px-6 py-3 text-sm font-bold text-ink">Full Past Papers</Link>
            <Link href="/exam-sprint" className="min-h-12 rounded-full border border-blue/20 bg-white px-6 py-3 text-sm font-bold text-ink">Exam Sprint</Link>
          </div>
        </section>
      ) : (
        <>
          <section className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">By chapter</h2>
            <p className="mt-2 text-sm text-muted">Latest and best result of each set you have attempted.</p>
            <div className="mt-5 overflow-x-auto rounded-[2rem] card p-2 sm:p-4">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                    <th className="px-4 py-3">Chapter</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3 text-right">Attempts</th>
                    <th className="px-4 py-3 text-right">Latest</th>
                    <th className="px-4 py-3 text-right">Best</th>
                    <th className="px-4 py-3 text-right">Last practised</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {chapters.map((chapter) => (
                    <tr key={chapter.chapterId} className="border-t border-blue/10">
                      <td className="px-4 py-3 font-semibold text-ink">{chapter.chapterTitle}</td>
                      <td className="px-4 py-3 text-muted">{LEVEL_NAMES[chapter.level] || chapter.level} · {PAPER_NAMES[chapter.paper] || chapter.paper}</td>
                      <td className="px-4 py-3 text-right text-muted">{chapter.attempts}</td>
                      <td className="px-4 py-3 text-right">{scoreCell(chapter.latest.score, chapter.latest.total)}</td>
                      <td className="px-4 py-3 text-right">{chapter.best ? scoreCell(chapter.best.score, chapter.best.total) : null}</td>
                      <td className="px-4 py-3 text-right text-muted">{chinaTime(chapter.latest.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/my-practice/${chapter.latest.id}`} className="font-bold text-blue">Review</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Every attempt</h2>
            <p className="mt-2 text-sm text-muted">Newest first{attempts.length >= 1000 ? " · showing the latest 1000" : ""}.</p>
            <div className="mt-5 overflow-x-auto rounded-[2rem] card p-2 sm:p-4">
              <table className="w-full min-w-[560px] text-left text-sm">
                <tbody>
                  {attempts.map((attempt, index) => {
                    const isNewChapter = index === 0 || attempts[index - 1].chapterId !== attempt.chapterId;
                    return (
                      <tr key={attempt.id} className="border-t border-blue/10">
                        <td className="px-4 py-3 text-muted">{chinaTime(attempt.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-ink">{attempt.chapterTitle}</span>
                          {isNewChapter ? <span className="ml-2 rounded-full bg-soft px-2 py-1 text-xs font-bold text-blue">latest</span> : null}
                          <span className="block text-xs text-muted">{LEVEL_NAMES[attempt.level] || attempt.level} · {PAPER_NAMES[attempt.paper] || attempt.paper}</span>
                        </td>
                        <td className="px-4 py-3 text-right">{scoreCell(attempt.score, attempt.total)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/my-practice/${attempt.id}`} className="font-bold text-blue">{isNewChapter ? "Review" : "View"}</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
