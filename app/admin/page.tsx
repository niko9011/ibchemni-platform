import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chapterProducts, isLegacyPlaceholderResource } from "@/lib/products";
import ResourceUploader from "@/app/admin/ResourceUploader";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams
}: {
  searchParams?: { videoSaved?: string; videoError?: string };
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
          <form action="/api/admin/questions" method="post" className="mt-5 space-y-4">
            <input name="title" placeholder="Question title" required className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
            <select name="topic" required className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
              <option value="">Choose chapter</option>
              {chapterProducts.map(([, chapterNo, title]) => (
                <option key={chapterNo} value={title}>{chapterNo}. {title}</option>
              ))}
            </select>
            <textarea name="question" placeholder="Question" required className="min-h-24 w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
            <textarea name="writtenAnswer" placeholder="Written answer" required className="min-h-32 w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
            <input name="imageUrl" placeholder="Tencent COS image URL, optional" className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
            <input name="videoUrl" placeholder="Tencent VOD/MP4 video URL, optional" className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
            <button className="w-full rounded-full bg-blue px-5 py-3 text-sm font-bold text-white">Publish answer</button>
          </form>
        </div>

        <div className="rounded-[2rem] card p-6">
          <h2 className="text-2xl font-semibold text-ink">Student Question Inbox</h2>
          <div className="mt-5 space-y-3">
            {submissions.map((submission) => (
              <article key={submission.id} className="rounded-2xl bg-soft p-4">
                <p className="text-sm font-bold text-blue">{submission.topic} · {submission.status}</p>
                <p className="mt-2 font-semibold text-ink">{submission.student.name} · {submission.student.email}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{submission.question}</p>
                {submission.fileUrl ? <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-blue">Open attachment</a> : null}
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
        <div className="mt-5 space-y-4">
          {students.map((student) => (
            <article key={student.id} className="rounded-[2rem] card p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-ink">{student.name}</h3>
                  <p className="text-sm text-muted">{student.email}</p>
                </div>
                <p className="text-sm font-bold text-blue">{student.enrollments.filter((e) => e.isActive).length} active chapters</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {student.enrollments.filter((e) => e.isActive).map((enrollment) => (
                  <span key={enrollment.id} className="rounded-full bg-soft px-3 py-2 text-xs font-bold text-blue">
                    {enrollment.product.level} {enrollment.product.chapterNo}. {enrollment.product.title}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
