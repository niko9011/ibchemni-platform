import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "TEACHER") redirect("/admin");

  const products = await prisma.product.findMany({
    orderBy: [{ level: "asc" }, { chapterNo: "asc" }],
    include: {
      enrollments: { where: { userId: user.id, isActive: true } },
      sections: { orderBy: { order: "asc" } },
      resources: true
    }
  });

  const unlocked = products.filter((product) => product.enrollments.length > 0);
  const locked = products.filter((product) => product.enrollments.length === 0);

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Student Dashboard</p>
          <h1 className="mobile-title mt-2 text-5xl font-semibold tracking-tight text-ink">Welcome, {user.name}</h1>
          <p className="mt-4 text-muted">Only chapters opened by IB chem Ni appear as unlocked.</p>
        </div>
        <form action="/api/auth/logout" method="post" className="w-full sm:w-auto">
          <button className="min-h-12 w-full rounded-full border border-blue/20 bg-white px-5 py-3 text-sm font-bold text-muted sm:w-auto">Logout</button>
        </form>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Unlocked Chapters</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {unlocked.map((product) => (
            <a key={product.id} href={`/products/${product.id}`} className="mobile-card block min-h-40 rounded-[2rem] card p-6 transition hover:-translate-y-1 active:scale-[0.99]">
              <p className="text-sm font-bold text-blue">{product.level} Chapter {product.chapterNo}</p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">{product.title}</h3>
              <p className="mt-4 text-sm leading-6 text-muted">{product.sections.length} sections · {product.resources.length} resources</p>
              <p className="mt-5 text-sm font-bold text-blue">Open chapter →</p>
            </a>
          ))}
          {unlocked.length === 0 ? (
            <div className="mobile-card rounded-[2rem] card p-6 text-muted">No chapters unlocked yet. Contact IB chem Ni after payment confirmation.</div>
          ) : null}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Locked Chapters</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {locked.map((product) => (
            <div key={product.id} className="rounded-2xl border border-blue/10 bg-white/70 p-4 sm:rounded-3xl sm:p-5">
              <p className="text-sm font-bold text-blue">{product.level} {product.chapterNo}</p>
              <h3 className="mt-2 break-words text-sm font-semibold leading-5 text-ink sm:text-base">{product.title}</h3>
              <p className="mt-2 text-sm text-muted">Locked</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
