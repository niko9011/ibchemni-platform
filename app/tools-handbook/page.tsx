import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools Handbook | IB chem Ni",
  description:
    "The Tools Handbook: IB Chemistry Guide 2025 skills framework taught in detail — experimental techniques, technology, mathematics, the inquiry process and the IA rules, each with practice and downloadable handouts."
};

const volumes = [
  {
    no: "Vol 1",
    title: "Experimental Techniques",
    page: "/tools-handbook/tool1.html",
    docx: "/tools-handbook/docx/L1_Tool1_Techniques_Handout.docx",
    blurb:
      "The toolbox for every practical in the course: safety and risk chains, choosing apparatus at the right precision, and eleven core techniques from standard solutions to reflux and distillation.",
    items: [
      "Safety of self, others and the environment",
      "Measuring variables to appropriate precision",
      "11 core techniques: standard solution, titration, calorimetry, chromatography, cells, colorimetry, recrystallization…",
      "Reflux vs distillation, with diagrams",
      "P1B technique questions + answer keys in class"
    ]
  },
  {
    no: "Vol 2",
    title: "Tool 2, Inquiry & the IA",
    page: "/tools-handbook/tool2-inquiry-ia.html",
    docx: "/tools-handbook/docx/L1_Tool2_Inquiry_IA_Handout.docx",
    blurb:
      "Technology, the inquiry process, and the rules of the internal assessment — how sensors, databases and simulations serve data, and how a research question scores.",
    items: [
      "Sensors, data loggers, databases and simulations",
      "Inquiry 1–3: research question → data → evaluation",
      "The IA: 10 hours, four criteria, 24 marks",
      "How this handbook feeds every IA criterion",
      "P1B-style critique practice"
    ]
  },
  {
    no: "Vol 3",
    title: "Mathematics",
    page: "/tools-handbook/tool3.html",
    docx: "/tools-handbook/docx/L1_Tool3_Mathematics_Handout.docx",
    blurb:
      "The module Paper 1B punishes hardest when it is weak: units, significant figures, recording and propagating uncertainties, and graphs with uncertainty bars and gradient limits.",
    items: [
      "SI prefixes, scientific notation, unit conversions",
      "Significant figures and appropriate precision",
      "Recording and propagating uncertainties (AHL powers)",
      "Best-fit lines, uncertainty bars, max/min gradients",
      "Practice drawn from the course's own practical data"
    ]
  }
];

export default function ToolsHandbookPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Complete Guide · L1 Tools</p>
      <h1 className="mobile-title mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">The Tools Handbook</h1>
      <p className="mt-4 max-w-3xl leading-7 text-muted">
        The Guide 2025 skills framework — Tool 1, Tool 2, Tool 3 and Inquiry 1–3 — taught in detail before
        the practical work of every unit begins. Read online or download the handout; worked answer keys are
        provided in class. Aligned to the official syllabus (Guide 2025, p.32–37) and the Teacher Support Material.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Three volumes</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {volumes.map((v) => (
            <div key={v.no} className="flex flex-col rounded-2xl border border-blue/10 bg-white/70 p-6">
              <p className="text-sm font-bold text-blue">{v.no}</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{v.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{v.blurb}</p>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted">
                {v.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href={v.page} className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                  Read online
                </a>
                <a href={v.docx} className="rounded-full border border-blue/30 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-soft">
                  Download .docx
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-blue/10 bg-soft p-6">
        <h2 className="text-lg font-semibold text-ink">How it fits the course</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
          Tools first, practicals second, exam third: these modules give the skills before the ten units demand
          them, the practical framework trains them, and Paper 1B tests them. Students revising for the exam
          sprint should pair this with{" "}
          <a href="/exam-sprint" className="font-semibold text-blue hover:underline">Exam Sprint</a> and the{" "}
          <a href="/ia" className="font-semibold text-blue hover:underline">IA Programme</a>.
        </p>
      </section>
    </main>
  );
}
