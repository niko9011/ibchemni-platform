import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chapterProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function QuestionHubPage({
  searchParams
}: {
  searchParams: { topic?: string; q?: string };
}) {
  const user = await getCurrentUser();
  const topic = searchParams.topic || "";
  const q = searchParams.q || "";
  const questions = await prisma.question.findMany({
    where: {
      isPublished: true,
      ...(topic ? { topic } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { question: { contains: q, mode: "insensitive" } },
              { writtenAnswer: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Question Hub</p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight text-ink">Search IB Chemistry questions by chapter.</h1>
      <p className="mt-4 max-w-3xl leading-8 text-muted">A searchable knowledge base for common IB Chemistry questions, written explanations, and future video solutions.</p>

      <form className="mt-8 grid gap-4 rounded-[2rem] card p-5 md:grid-cols-[1fr_260px_auto]">
        <input name="q" defaultValue={q} placeholder="Search question keywords" className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
        <select name="topic" defaultValue={topic} className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
          <option value="">All chapters</option>
          {chapterProducts.map(([, chapterNo, title]) => (
            <option key={chapterNo} value={title}>{chapterNo}. {title}</option>
          ))}
        </select>
        <button className="rounded-full bg-blue px-6 py-3 text-sm font-bold text-white">Search</button>
      </form>

      <section className="mt-10 grid gap-5 lg:grid-cols-[0.62fr_0.38fr]">
        <div className="space-y-5">
          {questions.map((question) => (
            <article key={question.id} className="rounded-[2rem] card p-6">
              <p className="text-sm font-bold text-blue">{question.topic}</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">{question.title}</h2>
              <p className="mt-4 leading-7 text-muted">{question.question}</p>
              <div className="mt-5 rounded-2xl bg-soft p-5">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue">Answer</p>
                <p className="mt-2 leading-7 text-ink">{question.writtenAnswer}</p>
                {question.videoUrl ? (
                  <a href={question.videoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-blue px-4 py-2 text-sm font-bold text-white">Watch explanation</a>
                ) : null}
              </div>
            </article>
          ))}
          {questions.length === 0 ? <div className="rounded-[2rem] card p-6 text-muted">No published questions yet.</div> : null}
        </div>

        <aside className="rounded-[2rem] card p-6">
          <h2 className="text-2xl font-semibold text-ink">Submit a question</h2>
          {user ? (
            <form action="/api/questions/submit" method="post" className="mt-5 space-y-4">
              <select name="topic" required className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
                <option value="">Choose chapter</option>
                {chapterProducts.map(([, chapterNo, title]) => (
                  <option key={chapterNo} value={title}>{chapterNo}. {title}</option>
                ))}
              </select>
              <textarea name="question" required placeholder="Type your question here" className="min-h-36 w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
              <input name="fileUrl" placeholder="Optional image/PDF link" className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
              <button className="w-full rounded-full bg-blue px-5 py-3 text-sm font-bold text-white">Submit question</button>
            </form>
          ) : (
            <div className="mt-5 rounded-2xl bg-soft p-5">
              <p className="leading-7 text-muted">Log in as a student to submit questions. Everyone can browse published answers.</p>
              <a href="/login" className="mt-4 inline-flex rounded-full bg-blue px-4 py-2 text-sm font-bold text-white">Login</a>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
