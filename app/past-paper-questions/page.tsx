export const metadata = { title: "Past Paper Questions | IB chem Ni" };

export default function PastPaperQuestionsPage() {
  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-5 sm:py-10">
      <div className="mb-4 px-2">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">IB Chemistry Practice</p>
        <h1 className="mobile-title mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Past Paper Questions</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Real IB exam questions grouped by syllabus unit — multiple choice with instant marking,
          structured questions with the official mark schemes, and new-syllabus sets
          (Structure &amp; Reactivity) for the 2025+ exams.
        </p>
      </div>
      <iframe
        title="Past Paper Questions"
        src="/ib-quiz-platform/index.html?entry=past-paper-questions#topic"
        className="h-[calc(100vh-220px)] min-h-[760px] w-full rounded-[1.5rem] border border-blue/10 bg-white"
        loading="lazy"
      />
    </main>
  );
}
