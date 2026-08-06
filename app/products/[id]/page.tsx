import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isLegacyPlaceholderResource } from "@/lib/products";
import TencentVodPlayer from "@/app/components/TencentVodPlayer";

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
      resources: true
    }
  });

  if (!product) notFound();
  const hasAccess = user.role === "TEACHER" || product.enrollments.length > 0;
  if (!hasAccess) redirect("/dashboard");

  const resources = product.resources
    .filter((resource) => !isLegacyPlaceholderResource(resource.title))
    .sort((a, b) => a.title.localeCompare(b.title, "en", { numeric: true }));

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
      <a href="/dashboard" className="mb-6 inline-flex min-h-11 items-center text-sm font-bold text-blue">← Back to dashboard</a>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">{product.level} Chapter {product.chapterNo}</p>
      <h1 className="mobile-title mt-3 text-5xl font-semibold tracking-tight text-ink">{product.title}</h1>
      <p className="mt-4 max-w-3xl leading-8 text-muted">{product.description}</p>

      <section className="mobile-card mt-10 rounded-[2rem] card p-6">
        <h2 className="text-2xl font-semibold text-ink">Chapter Content</h2>
        <p className="mt-2 text-sm text-muted">Videos and course files are listed together in numbered order.</p>
        <div className="mt-5 space-y-4">
          {resources.map((resource) => (
            <article key={resource.id} className="rounded-2xl bg-soft p-4 sm:p-5">
              <p className="font-semibold text-ink">{resource.title}</p>
              {resource.type === "VIDEO" && resource.vodFileId ? (
                <TencentVodPlayer resourceId={resource.id} title={resource.title} />
              ) : (
                <>
                  <p className="mt-1 text-sm text-muted">
                    {resource.type} · {resource.type === "VIDEO" ? "Video coming soon" : resource.storageKey ? "Protected PDF" : "PDF coming soon"}
                  </p>
                  {resource.type !== "VIDEO" && resource.storageKey ? (
                    <a href={`/api/resources/${resource.id}/download`} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-blue px-5 text-sm font-bold text-white">
                      Open PDF
                    </a>
                  ) : null}
                </>
              )}
            </article>
          ))}
          {resources.length === 0 ? <p className="text-muted">Course content is being prepared.</p> : null}
        </div>
      </section>
    </main>
  );
}
