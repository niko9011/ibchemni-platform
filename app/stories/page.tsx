const stories = [
  ["SL Student", "Predicted 4", "Final 6", "Weak foundations and low confidence", "Topic-by-topic revision and exam practice"],
  ["HL Student", "Predicted 5", "Final 7", "Calculations and Paper 2 were difficult", "Systematic problem-solving training"],
  ["IA Student", "14/24", "21/24", "Unclear research question and weak evaluation", "IA structure, data analysis, and evaluation coaching"],
  ["Summer Bridging Student", "No IB background", "Strong DP1 start", "No prior IB Chemistry background", "Pre-learning atomic structure, mole, bonding, and periodic trends"]
];

export default function StoriesPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Student Stories</p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight text-ink">Real Students. Real Progress.</h1>
      <p className="mt-4 text-muted">Student details are anonymized for privacy.</p>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {stories.map(([type, from, to, problem, solution]) => (
          <article key={type} className="rounded-[2rem] card p-7">
            <p className="text-sm font-bold text-blue">{type}</p>
            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="rounded-3xl bg-soft p-5 text-center">
                <p className="text-sm text-muted">From</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{from}</p>
              </div>
              <p className="text-2xl font-semibold text-blue">→</p>
              <div className="rounded-3xl bg-blue p-5 text-center text-white">
                <p className="text-sm text-white/75">To</p>
                <p className="mt-2 text-2xl font-semibold">{to}</p>
              </div>
            </div>
            <p className="mt-6 text-sm leading-6 text-muted"><strong className="text-ink">Problem:</strong> {problem}</p>
            <p className="mt-3 text-sm leading-6 text-muted"><strong className="text-ink">Solution:</strong> {solution}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
