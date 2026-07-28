export const dynamic = "force-dynamic";

const links = [
  ["Question Hub", "/questions", "Search IB Chemistry questions by chapter."],
  ["Free Resources", "/resources", "Preview notes and selected lessons."],
  ["Student Stories", "/stories", "Real progress from real students."],
  ["Contact Me", "/contact", "Email and WeChat contact information."],
  ["Course Login", "/login", "Enter purchased chapter courses."]
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid min-h-[72vh] max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[0.55fr_0.45fr]">
        <div>
          <p className="inline-flex rounded-full border border-blue/20 bg-white px-5 py-3 text-sm font-bold text-blue">IB Chemistry · SL & HL · IA · Exams</p>
          <h1 className="mt-8 text-6xl font-semibold tracking-tight text-ink md:text-7xl">Master IB Chemistry through a structured learning system.</h1>
          <p className="mt-6 max-w-2xl text-xl leading-9 text-muted">Built by IB chem Ni for students who want clear explanations, stronger foundations, and exam-focused progress.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="/questions" className="rounded-full bg-blue px-6 py-4 text-sm font-bold text-white">Explore Question Hub</a>
            <a href="/resources" className="rounded-full border border-blue/20 bg-white px-6 py-4 text-sm font-bold text-ink">Watch Free Preview</a>
          </div>
        </div>
        <div className="rounded-[2rem] card p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Platform</p>
          <div className="mt-6 grid gap-4">
            {links.map(([title, href, description]) => (
              <a key={title} href={href} className="rounded-3xl bg-soft p-5 transition hover:-translate-y-1">
                <h2 className="text-xl font-semibold text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
