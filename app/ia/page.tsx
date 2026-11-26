import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IA Programme | IB chem Ni",
  description: "The IB Chemistry Internal Assessment programme: topic selection, methodology, data analysis, academic writing and draft feedback."
};

const modules = [
  ["01", "IA Orientation", "How the IA is marked against the official criteria, what examiners reward, and how to choose a research question that scores."],
  ["02", "Topic & Research Question", "Turning an interest into a focused, measurable question — with a library of workable topic examples and the pitfalls that cap scores."],
  ["03", "Methodology & Variables", "Designing a controlled experiment: variables, equipment, uncertainties and safety, recorded the way the criteria expect."],
  ["04", "Data Collection & Processing", "Raw data tables, processed results, propagation of uncertainties, graphs with correct axes, error bars and lines of best fit."],
  ["05", "Analysis & Conclusion", "Interpreting results with chemistry, evaluating limitations, and suggesting realistic improvements — the highest-value criteria."],
  ["06", "Academic Writing & Submission", "Structure, academic honesty, citations, and the final checklist before the deadline."]
];

export default function IaProgrammePage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Course Series</p>
      <h1 className="mobile-title mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">The IA Programme</h1>
      <p className="mt-4 max-w-3xl leading-7 text-muted">
        A complete Internal Assessment series for IB Chemistry: from choosing a research question to
        the final submission draft. Recorded lessons with handouts, worked examples of high-scoring
        IAs, and personal feedback on your draft at each milestone.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Programme modules</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {modules.map(([no, title, body]) => (
            <div key={no} className="rounded-2xl border border-blue/10 bg-white/70 p-6">
              <p className="text-sm font-bold text-blue">{no}</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-[2rem] card p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Enrolment &amp; feedback</h2>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Each module includes the recorded lesson, the blank and completed handouts, and a past-paper
          style checkpoint. Draft feedback is given milestone by milestone, so the report is finished
          step by step instead of in one late-night rewrite.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <a href="/contact" className="min-h-12 rounded-full bg-blue px-6 py-3 text-sm font-bold text-white">Enquire about the IA programme</a>
          <a href="/past-paper-questions" className="min-h-12 rounded-full border border-blue/20 bg-white px-6 py-3 text-sm font-bold text-muted">Try the question bank</a>
        </div>
      </section>
    </main>
  );
}
