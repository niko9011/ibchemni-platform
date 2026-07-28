import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FreeResourcesPage() {
  const resources = await prisma.freeResource.findMany({
    where: { isPublished: true },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }]
  });

  const notes = resources.filter((resource) => resource.category === "Notes");
  const videos = resources.filter((resource) => resource.category === "Videos");

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Free Resources</p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight text-ink">IB Chemistry free notes and preview videos</h1>
      <p className="mt-4 max-w-3xl leading-8 text-muted">Download starter notes and watch selected preview lessons before joining a chapter course.</p>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <ResourceGroup title="Notes" empty="No notes have been published yet." resources={notes} action="Download" />
        <ResourceGroup title="Videos" empty="No preview videos have been published yet." resources={videos} action="Watch" />
      </section>
    </main>
  );
}

function ResourceGroup({
  title,
  resources,
  empty,
  action
}: {
  title: string;
  resources: Array<{ id: string; title: string; description: string; topic: string | null; url: string }>;
  empty: string;
  action: string;
}) {
  return (
    <div className="rounded-[2rem] card p-6">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <div className="mt-5 space-y-4">
        {resources.map((resource) => (
          <article key={resource.id} className="rounded-2xl bg-soft p-5">
            <p className="text-sm font-bold text-blue">{resource.topic || "IB Chemistry"}</p>
            <h3 className="mt-2 text-xl font-semibold text-ink">{resource.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{resource.description}</p>
            <a href={resource.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-blue px-4 py-2 text-sm font-bold text-white">
              {action}
            </a>
          </article>
        ))}
        {resources.length === 0 ? <p className="text-muted">{empty}</p> : null}
      </div>
    </div>
  );
}
