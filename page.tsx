import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProductAccessPage({
  params
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      enrollments: { where: { userId: user.id, isActive: true } },
      sections: { orderBy: { order: "asc" }, include: { resources: true } },
      resources: true
    }
  });

  if (!product) notFound();
  const hasAccess = user.role === "TEACHER" || product.enrollments.length > 0;
  if (!hasAccess) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">{product.level} Chapter {product.chapterNo}</p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight text-ink">{product.title}</h1>
      <p className="mt-4 max-w-3xl leading-8 text-muted">{product.description}</p>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        {product.sections.map((section) => (
          <div key={section.id} className="rounded-[2rem] card p-6">
            <p className="text-sm font-bold text-blue">Section {section.order}</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{section.title}</h2>
            <div className="mt-5 space-y-3">
              {section.resources.map((resource) => (
                <div key={resource.id} className="rounded-2xl bg-soft p-4">
                  <p className="font-semibold text-ink">{resource.title}</p>
                  <p className="mt-1 text-sm text-muted">{resource.type} · secure link will be connected later</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-[2rem] card p-6">
        <h2 className="text-2xl font-semibold text-ink">Chapter Resources</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {product.resources.map((resource) => (
            <div key={resource.id} className="rounded-2xl bg-soft p-4">
              <p className="font-semibold text-ink">{resource.title}</p>
              <p className="mt-1 text-sm text-muted">{resource.type} · protected download</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
