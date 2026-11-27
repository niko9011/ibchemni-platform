import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isLegacyPlaceholderResource } from "@/lib/products";
import { withPracticeSchema } from "@/lib/practice-schema";
import { ATTEMPT_SELECT, LEVEL_NAMES, PAPER_NAMES, chinaTime, marksText, percentText, summarizeByChapter } from "@/lib/practice-summary";
import type { AttemptRow } from "@/lib/practice-summary";
import { UNLOCK_ITEMS, unlockItemLabel } from "@/lib/quiz-access";
import ResourceUploader from "@/app/admin/ResourceUploader";
import QuestionPublishForm from "@/app/components/QuestionPublishForm";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams
}: {
  searchParams?: { videoSaved?: string; videoError?: string; unlockFailed?: string };
}) {
  const teacher = await requireTeacher();
  if (!teacher) redirect("/login");

  const [students, products, submissions, questions, diagnosisRequests, videoResources, pdfResources] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      include: { enrollments: { include: { product: true }, orderBy: { createdAt: "desc" } } }
    }),
    prisma.product.findMany({ orderBy: [{ level: "asc" }, { chapterNo: "asc" }] }),
    prisma.questionSubmission.findMany({ orderBy: { createdAt: "desc" }, include: { student: true }, take: 20 }),
    prisma.question.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.diagnosisRequest.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.resource.findMany({
      where: { type: "VIDEO" },
      include: { product: true, section: true },
      orderBy: { title: "asc" }
    }),
    prisma.resource.findMany({
      where: { type: { not: "VIDEO" } },
      include: { product: true, section: true },
      orderBy: [{ productId: "asc" }, { title: "asc" }]
    })
  ]);

  const visibleVideoResources = videoResources.filter((resource) => !isLegacyPlaceholderResource(resource.title));
  const visiblePdfResources = pdfResources.filter((resource) => !isLegacyPlaceholderResource(resource.title));

  /* Practice results and hand-unlocked sets, one line per student. A failure here must not take
     the rest of the admin page down, so it degrades to a notice. */
  const studentIds = students.map((student) => student.id);
  let practiceError = "";
  let attempts: AttemptRow[] = [];
  let grants: { id: string; userId: string; itemKey: string; createdAt: Date }[] = [];
  try {
    [attempts, grants] = await withPracticeSchema(() => Promise.all([
      prisma.practiceAttempt.findMany({ where: { userId: { in: studentIds } }, orderBy: { createdAt: "desc" }, take: 5000, select: ATTEMPT_SELECT }),
      prisma.quizGrant.findMany({ where: { userId: { in: studentIds } }, orderBy: { createdAt: "desc" } })
    ]));
  } catch (error) {
    practiceError = error instanceof Error ? error.message : "Could not read practice results.";
  }
  const attemptsOf = (studentId: string) => attempts.filter((row) => row.userId === studentId);
  const grantsOf = (studentId: string) => grants.filter((grant) => grant.userId === studentId);
  const overview = students
    .map((student) => {
      const rows = attemptsOf(student.id);
      return {
        student,
        count: rows.length,
        chapters: summarizeByChapter(rows).length,
        earned: rows.reduce((sum, row) => sum + row.score, 0),
        possible: rows.reduce((sum, row) => sum + row.total, 0),
        last: rows[0]?.createdAt || null
      };
    })
    .sort((a, b) => {
      if (a.last === b.last) return a.student.name.localeCompare(b.student.name);
      if (!a.last) return 1;
      if (!b.last) return -1;
      return b.last.getTime() - a.last.getTime();
    });
  const unlockGroups = Array.from(new Set(UNLOCK_ITEMS.map((item) => item.group)));
  const scoreText = (score: number, total: number) => `${marksText(score, total)} · ${percentText(score, total)}`;

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Teacher Admin</p>
          <h1 className="mt-2 text-5xl font-semibold tracking-tight text-ink">Manual access control</h1>
          <p className="mt-4 text-muted">Create student accounts and open chapter access after payment.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="rounded-full border border-blue/20 bg-white px-5 py-3 text-sm font-bold text-muted">Logout</button>
        </form>
      </div>

      <section className="mt-10 rounded-[2rem] card p-6">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue">Practice</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Student practice summary</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          What each student has done on the practice pages, newest activity first. Open a student below to see the result of each chapter and to unlock further sets by hand.
        </p>
        {practiceError ? (
          <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">Practice results are unavailable right now: {practiceError}</p>
        ) : null}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3 text-right">Attempts</th>
                <th className="px-4 py-3 text-right">Chapters</th>
                <th className="px-4 py-3 text-right">Marks</th>
                <th className="px-4 py-3 text-right">Last practised</th>
              </tr>
            </thead>
            <tbody>
              {overview.map(({ student, count, chapters, earned, possible, last }) => (
                <tr key={student.id} className="border-t border-blue/10">
                  <td className="px-4 py-3">
                    <a href={`#student-${student.id}`} className="font-semibold text-ink">{student.name}</a>
                    <span className="block text-xs text-muted">{student.email}</span>
                  </td>
                  <td className={`px-4 py-3 text-right ${count ? "font-semibold text-ink" : "text-muted"}`}>{count}</td>
                  <td className={`px-4 py-3 text-right ${count ? "font-semibold text-ink" : "text-muted"}`}>{chapters}</td>
                  <td className={`px-4 py-3 text-right ${count ? "font-semibold text-ink" : "text-muted"}`}>{count ? scoreText(earned, possible) : "–"}</td>
                  <td className="px-4 py-3 text-right text-muted">{last ? chinaTime(last) : "No practice yet"}</td>
                </tr>
              ))}
              {overview.length === 0 ? (
                <tr className="border-t border-blue/10"><td className="px-4 py-3 text-muted" colSpan={5}>No student accounts yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
        <div className="rounded-[2rem] card p-6">
          <h2 className="text-2xl font-semibold text-ink">Create Student</h2>
          <form action="/api/admin/students" method="post" className="mt-5 space-y-4">
            <input name="name" placeholder="Student name" required className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
            <input name="email" type="email" placeholder="Student email" required className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
            <input name="password" placeholder="Temporary password" required className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
            <button className="w-full rounded-full bg-blue px-5 py-3 text-sm font-bold text-white">Create account</button>
          </form>
        </div>

        <div className="rounded-[2rem] card p-6">
          <h2 className="text-2xl font-semibold text-ink">Open Chapter Access</h2>
          <form action="/api/admin/access" method="post" className="mt-5 grid gap-4 md:grid-cols-2">
            <select name="userId" required className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
              <option value="">Choose student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.name} · {student.email}</option>
              ))}
            </select>
            <select name="productId" required className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
              <option value="">Choose chapter</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.level} {product.chapterNo}. {product.title}</option>
              ))}
            </select>
            <input name="note" placeholder="Payment note, optional" className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue md:col-span-2" />
            <button name="action" value="grant" className="rounded-full bg-blue px-5 py-3 text-sm font-bold text-white">Open access</button>
            <button name="action" value="revoke" className="rounded-full border border-blue/20 bg-white px-5 py-3 text-sm font-bold text-muted">Close access</button>
          </form>
        </div>
      </section>

      <section id="course-pdfs" className="mt-10 scroll-mt-24 rounded-[2rem] card p-6">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue">Tencent COS</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Upload protected course PDFs</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Choose the matching resource card and PDF. The browser uploads directly to your private Tencent COS bucket; only students with chapter access receive a short-lived download link.
        </p>
        <ResourceUploader resources={visiblePdfResources.map((resource) => ({
          id: resource.id,
          storageKey: resource.storageKey,
          label: `${resource.product.level} ${resource.product.chapterNo}. ${resource.product.title} · ${resource.title}`
        }))} />
      </section>

      <section id="course-videos" className="mt-10 scroll-mt-24 rounded-[2rem] card p-6">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue">Tencent VOD</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Connect a video to a chapter</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Upload the video to Tencent VOD first, then paste its numeric FileID here. Students still need login and chapter access to play it.
        </p>
        {searchParams?.videoSaved ? (
          <p className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-800">Video FileID saved.</p>
        ) : null}
        {searchParams?.videoError ? (
          <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">Choose a video lesson and enter a valid numeric FileID.</p>
        ) : null}
        <form action="/api/admin/resources/vod" method="post" className="mt-6 grid gap-4 md:grid-cols-[1fr_280px_auto]">
          <select name="resourceId" required className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
            <option value="">Choose course video lesson</option>
            {visibleVideoResources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.product.level} {resource.product.chapterNo}. {resource.product.title} · {resource.title}
              </option>
            ))}
          </select>
          <input name="vodFileId" inputMode="numeric" placeholder="Tencent VOD FileID" required className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
          <button className="min-h-12 rounded-full bg-blue px-5 py-3 text-sm font-bold text-white">Save video</button>
        </form>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {visibleVideoResources.filter((resource) => resource.vodFileId).map((resource) => (
            <div key={resource.id} className="rounded-2xl bg-soft p-4">
              <p className="text-sm font-bold text-blue">{resource.product.level} {resource.product.chapterNo} · {resource.product.title}</p>
              <p className="mt-2 font-semibold text-ink">{resource.title}</p>
              <p className="mt-1 break-all text-xs text-muted">FileID: {resource.vodFileId}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] card p-6">
        <h2 className="text-2xl font-semibold text-ink">Free Assessment Leads</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {diagnosisRequests.map((request) => (
            <article key={request.id} className="rounded-2xl bg-soft p-5">
              <p className="text-sm font-bold text-blue">{request.status} · {request.courseLevel || "Level not set"}</p>
              <h3 className="mt-2 text-xl font-semibold text-ink">{request.studentName}</h3>
              <p className="mt-1 text-sm text-muted">{request.email}</p>
              <p className="mt-3 text-sm leading-6 text-muted">School: {request.school || "-"} · Grade: {request.gradeLevel || "-"}</p>
              <p className="mt-2 text-sm leading-6 text-muted">Current: {request.currentGrade || "-"} · Target: {request.targetGrade || "-"}</p>
              <p className="mt-2 text-sm leading-6 text-muted">Difficult topics: {request.difficultTopics || "-"}</p>
              <p className="mt-2 text-sm leading-6 text-muted">IA: {request.iaStatus || "-"} · Exam: {request.examDate || "-"}</p>
              {request.message ? <p className="mt-3 text-sm leading-6 text-ink">{request.message}</p> : null}
            </article>
          ))}
          {diagnosisRequests.length === 0 ? <p className="text-muted">No assessment requests yet.</p> : null}
        </div>
      </section>

      <section id="questions" className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] card p-6">
          <h2 className="text-2xl font-semibold text-ink">Publish Question Hub Answer</h2>
          <QuestionPublishForm />
        </div>

        <div className="rounded-[2rem] card p-6">
          <h2 className="text-2xl font-semibold text-ink">Student Question Inbox</h2>
          <div className="mt-5 space-y-3">
            {submissions.map((submission) => (
              <article key={submission.id} className="rounded-2xl bg-soft p-4">
                <p className="text-sm font-bold text-blue">{submission.topic} · {submission.status}</p>
                <p className="mt-2 font-semibold text-ink">{submission.student.name} · {submission.student.email}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{submission.question}</p>
                {submission.fileUrl ? <a href={submission.fileUrl.startsWith("cos:") ? `/api/question-media?kind=submission&id=${submission.id}` : submission.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-blue">Open image</a> : null}
              </article>
            ))}
            {submissions.length === 0 ? <p className="text-muted">No submitted questions yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] card p-6">
        <h2 className="text-2xl font-semibold text-ink">Latest Published Questions</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {questions.map((question) => (
            <div key={question.id} className="rounded-2xl bg-soft p-4">
              <p className="text-sm font-bold text-blue">{question.topic}</p>
              <p className="mt-2 font-semibold text-ink">{question.title}</p>
            </div>
          ))}
          {questions.length === 0 ? <p className="text-muted">No published questions yet.</p> : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-3xl font-semibold tracking-tight text-ink">Students</h2>
        {searchParams?.unlockFailed ? (
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">That unlock change could not be saved. Please try again.</p>
        ) : null}
        <p className="mt-2 text-sm text-muted">Chapter access opens the videos, handouts and questions of a purchased chapter. Practice unlocks open question sets only.</p>
        <div className="mt-5 space-y-4">
          {students.map((student) => {
            const rows = attemptsOf(student.id);
            const chapters = summarizeByChapter(rows);
            const studentGrants = grantsOf(student.id);
            return (
            <article id={`student-${student.id}`} key={student.id} className="scroll-mt-24 rounded-[2rem] card p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{student.name}</h3>
                  <p className="text-sm text-muted">{student.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-soft px-3 py-2 text-xs font-bold text-blue">{student.enrollments.filter((e) => e.isActive).length} chapters opened</span>
                  <span className="rounded-full bg-soft px-3 py-2 text-xs font-bold text-blue">{studentGrants.length} practice unlocks</span>
                  <span className={`rounded-full px-3 py-2 text-xs font-bold ${rows.length ? "bg-green-50 text-green-800" : "bg-soft text-muted"}`}>
                    {rows.length ? `${rows.length} attempts · ${chapters.length} chapters` : "No practice yet"}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {student.enrollments.filter((e) => e.isActive).map((enrollment) => (
                  <span key={enrollment.id} className="rounded-full border border-blue/20 bg-white px-3 py-2 text-xs font-bold text-ink">
                    {enrollment.product.level} {enrollment.product.chapterNo}. {enrollment.product.title}
                  </span>
                ))}
              </div>

              {rows.length ? (
                <details className="mt-5" open>
                  <summary className="cursor-pointer text-sm font-bold text-blue">Practice by chapter ({chapters.length})</summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead>
                        <tr className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                          <th className="px-3 py-2">Chapter</th>
                          <th className="px-3 py-2">Section</th>
                          <th className="px-3 py-2 text-right">Attempts</th>
                          <th className="px-3 py-2 text-right">Latest</th>
                          <th className="px-3 py-2 text-right">Best</th>
                          <th className="px-3 py-2 text-right">Last practised</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chapters.map((chapter) => (
                          <tr key={chapter.chapterId} className="border-t border-blue/10">
                            <td className="px-3 py-2 font-semibold text-ink">{chapter.chapterTitle}</td>
                            <td className="px-3 py-2 text-muted">{LEVEL_NAMES[chapter.level] || chapter.level} · {PAPER_NAMES[chapter.paper] || chapter.paper}</td>
                            <td className="px-3 py-2 text-right text-muted">{chapter.attempts}</td>
                            <td className="px-3 py-2 text-right font-semibold text-ink">{scoreText(chapter.latest.score, chapter.latest.total)}</td>
                            <td className="px-3 py-2 text-right text-ink">{chapter.best ? scoreText(chapter.best.score, chapter.best.total) : "–"}</td>
                            <td className="px-3 py-2 text-right text-muted">{chinaTime(chapter.latest.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ) : null}

              <div className="mt-5 border-t border-blue/10 pt-5">
                <p className="text-sm font-bold text-ink">Practice unlocks (questions only)</p>
                {studentGrants.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {studentGrants.map((grant) => (
                      <form key={grant.id} action="/api/admin/quiz-grants" method="post" className="inline">
                        <input type="hidden" name="userId" value={student.id} />
                        <input type="hidden" name="itemKey" value={grant.itemKey} />
                        <button name="action" value="revoke" title="Take back this unlock" className="rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-800 transition hover:bg-red-50 hover:text-red-700">
                          {unlockItemLabel(grant.itemKey)} ✕
                        </button>
                      </form>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted">No sets unlocked by hand.</p>
                )}
                <form action="/api/admin/quiz-grants" method="post" className="mt-3 flex flex-col gap-3 md:flex-row">
                  <input type="hidden" name="userId" value={student.id} />
                  <select name="itemKey" required className="min-h-12 rounded-2xl border border-blue/20 bg-white px-4 py-3 outline-none focus:border-blue md:flex-1">
                    <option value="">Unlock a practice set…</option>
                    {unlockGroups.map((group) => (
                      <optgroup key={group} label={group}>
                        {UNLOCK_ITEMS.filter((item) => item.group === group).map((item) => (
                          <option key={item.key} value={item.key}>{item.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <button name="action" value="grant" className="min-h-12 rounded-full bg-blue px-5 py-3 text-sm font-bold text-white">Unlock</button>
                </form>
              </div>
            </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
