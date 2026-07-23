import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const teacher = await requireTeacher();
  if (!teacher) redirect("/login");

  const [students, products] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      include: { enrollments: { include: { product: true }, orderBy: { createdAt: "desc" } } }
    }),
    prisma.product.findMany({ orderBy: [{ level: "asc" }, { chapterNo: "asc" }] })
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
