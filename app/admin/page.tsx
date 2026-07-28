import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chapterProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const teacher = await requireTeacher();
  if (!teacher) redirect("/login");

  const [students, products, submissions, questions, freeResources, diagnosisRequests] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      include: { enrollments: { include: { product: true }, orderBy: { createdAt: "desc" } } }
    }),
    prisma.product.findMany({ orderBy: [{ level: "asc" }, { chapterNo: "asc" }] }),
    prisma.questionSubmission.findMany({ orderBy: { createdAt: "desc" }, include: { student: true }, take: 20 }),
    prisma.question.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.freeResource.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.diagnosisRequest.findMany({ orderBy: { createdAt: "desc" }, take: 20 })
  ]);

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

      <section id="resources" className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] card p-6">
          <h2 className="text-2xl font-semibold text-ink">Publish Free Resource</h2>
          <p className="mt-2 text-sm text-muted">Paste Tencent COS, Tencent VOD, or CDN links here.</p>
          <form action="/api/admin/free-resources" method="post" className="mt-5 space-y-4">
            <input name="title" placeholder="Resource title" required className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
            <select name="category" className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
              <option value="Notes">Notes</option>
              <option value="Videos">Videos</option>
            </select>
            <select name="topic" className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
              <option value="">Choose topic, optional</option>
              {chapterProducts.map(([, chapterNo, title]) => (
                <option key={chapterNo} value={title}>{chapterNo}. {title}</option>
              ))}
            </select>
            <input name="url" placeholder="File or video URL" required className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
            <textarea name="description" placeholder="Short description" required className="min-h-28 w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
            <button className="w-full rounded-full bg-blue px-5 py-3 text-sm font-bold text-white">Publish resource</button>
          </form>
        </div>

        <div className="rounded-[2rem] card p-6">
          <h2 className="text-2xl font-semibold text-ink">Latest Free Resources</h2>
          <div className="mt-5 space-y-3">
            {freeResources.map((resource) => (
              <div key={resource.id} className="rounded-2xl bg-soft p-4">
                <p className="font-semibold text-ink">{resource.title}</p>
                <p className="mt-1 text-sm text-muted">{resource.category} · {resource.topic || "General"}</p>
              </div>
            ))}
            {freeResources.length === 0 ? <p className="text-muted">No free resources yet.</p> : null}
          </div>
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
            <input name="videoUrl" placeholder="Optional explanation video URL" className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
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
