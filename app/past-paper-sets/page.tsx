export const metadata = { title: "Full Past Papers | IB chem Ni" };

export default function PastPaperSetsPage() {
  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-5 sm:py-10">
      <div className="mb-4 px-2">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">IB Chemistry Practice</p>
        <h1 className="mobile-title mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Full Past Paper Practice</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Complete exam papers as timed-style sets: Paper 1 multiple choice and Paper 2 structured
          questions with official mark schemes, for both SL and HL. Papers are shown as numbered
          sets, just like sitting the real exam.
        </p>
      </div>
      <iframe
        title="Full Past Paper Practice"
        src="/ib-quiz-platform/index.html?entry=past-paper-sets#sets"
        className="h-[calc(100vh-220px)] min-h-[760px] w-full rounded-[1.5rem] border border-blue/10 bg-white"
        loading="lazy"
      />
    </main>
  );
}
