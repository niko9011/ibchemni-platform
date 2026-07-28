const features = ["Concept-first learning", "Visual explanations", "Exam strategy", "Structured notes", "Personalized guidance"];

const stories = [
  ["SL Student", "Predicted 4", "Final 6", "Weak foundations and low confidence", "Topic-by-topic revision and exam practice"],
  ["HL Student", "Predicted 5", "Final 7", "Calculations and Paper 2 were difficult", "Systematic problem-solving training"],
  ["IA Student", "14/24", "21/24", "Unclear research question and weak evaluation", "IA structure, data analysis, and evaluation coaching"],
  ["Summer Bridging Student", "No IB background", "Strong DP1 start", "No prior IB Chemistry background", "Pre-learning atomic structure, mole, bonding, and periodic trends"]
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <section className="mobile-card rounded-[2rem] card p-8 md:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">About Me</p>
        <h1 className="mobile-title mt-4 text-5xl font-semibold tracking-tight text-ink">IB chem Ni · IB化学提分专家</h1>
        <p className="mt-5 max-w-3xl text-2xl font-semibold leading-10 text-ink">Helping IB Students Understand Chemistry, Not Memorize It.</p>
        <p className="mt-6 max-w-4xl text-lg leading-9 text-muted">
          Hi, I am IB chem Ni, an IB Chemistry teacher with over 10 years of teaching experience. I help students build a clear understanding of Chemistry through structured explanations, visual learning, and exam-focused strategies.
        </p>
        <p className="mt-4 max-w-4xl text-lg leading-9 text-muted">
          我是一名拥有10年以上教学经验的IB化学老师。我希望帮助学生通过清晰的知识结构、可视化讲解和考试导向的方法，真正学懂化学。
        </p>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="mobile-card rounded-[2rem] card p-8">
          <h2 className="text-3xl font-semibold text-ink">Teaching Philosophy</h2>
          <p className="mt-5 leading-8 text-muted">Chemistry should not feel overwhelming. Every difficult concept can become simple when explained the right way. I do not teach students to memorize answers. I teach them how to think.</p>
          <p className="mt-4 leading-8 text-muted">我相信化学不应该让学生感到痛苦。只要讲解方式正确，复杂概念也可以变得清晰。我不只是教学生记答案，而是教学生如何思考。</p>
        </div>
        <div className="mobile-card rounded-[2rem] card p-8">
          <h2 className="text-3xl font-semibold text-ink">Teaching Features</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {features.map((feature) => (
              <span key={feature} className="rounded-full bg-soft px-4 py-3 text-sm font-bold text-blue">{feature}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="student-reviews" className="mt-16 scroll-mt-24">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Student Reviews</p>
        <h2 className="mobile-title mt-3 text-5xl font-semibold tracking-tight text-ink">What students say.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            "The explanations made difficult chemistry concepts much clearer.",
            "I became more confident with calculations and Paper 2 questions.",
            "The structured revision plan helped me study with direction."
          ].map((review) => (
            <blockquote key={review} className="mobile-card rounded-[2rem] card p-7">
              <p className="text-lg leading-8 text-ink">“{review}”</p>
              <footer className="mt-5 text-sm font-bold text-blue">IB Chemistry Student</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="student-stories" className="mt-16 scroll-mt-24">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Student Stories</p>
        <h2 className="mobile-title mt-3 text-5xl font-semibold tracking-tight text-ink">Real students. Real progress.</h2>
        <p className="mt-4 text-muted">Student details are anonymized for privacy.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {stories.map(([type, from, to, problem, solution]) => (
            <article key={type} className="mobile-card rounded-[2rem] card p-7">
              <p className="text-sm font-bold text-blue">{type}</p>
              <div className="mt-5 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-2xl bg-soft p-4 text-center">
                  <p className="text-xs text-muted">From</p>
                  <p className="mt-2 text-xl font-semibold text-ink">{from}</p>
                </div>
                <p className="text-center text-xl font-semibold text-blue"><span className="sm:hidden">↓</span><span className="hidden sm:inline">→</span></p>
                <div className="rounded-2xl bg-blue p-4 text-center text-white">
                  <p className="text-xs text-white/75">To</p>
                  <p className="mt-2 text-xl font-semibold">{to}</p>
                </div>
              </div>
              <p className="mt-6 text-sm leading-6 text-muted"><strong className="text-ink">Problem:</strong> {problem}</p>
              <p className="mt-3 text-sm leading-6 text-muted"><strong className="text-ink">Solution:</strong> {solution}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
