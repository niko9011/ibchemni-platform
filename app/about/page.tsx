const features = ["Concept-first learning", "Visual explanations", "Exam strategy", "Structured notes", "Personalized guidance"];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <section className="rounded-[2rem] card p-8 md:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">About Me</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-ink">IB chem Ni · IB化学提分专家</h1>
        <p className="mt-5 max-w-3xl text-2xl font-semibold leading-10 text-ink">Helping IB Students Understand Chemistry, Not Memorize It.</p>
        <p className="mt-6 max-w-4xl text-lg leading-9 text-muted">
          Hi, I am IB chem Ni, an IB Chemistry teacher with over 10 years of teaching experience. I help students build a clear understanding of Chemistry through structured explanations, visual learning, and exam-focused strategies.
        </p>
        <p className="mt-4 max-w-4xl text-lg leading-9 text-muted">
          我是一名拥有10年以上教学经验的IB化学老师。我希望帮助学生通过清晰的知识结构、可视化讲解和考试导向的方法，真正学懂化学。
        </p>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] card p-8">
          <h2 className="text-3xl font-semibold text-ink">Teaching Philosophy</h2>
          <p className="mt-5 leading-8 text-muted">Chemistry should not feel overwhelming. Every difficult concept can become simple when explained the right way. I do not teach students to memorize answers. I teach them how to think.</p>
          <p className="mt-4 leading-8 text-muted">我相信化学不应该让学生感到痛苦。只要讲解方式正确，复杂概念也可以变得清晰。我不只是教学生记答案，而是教学生如何思考。</p>
        </div>
        <div className="rounded-[2rem] card p-8">
          <h2 className="text-3xl font-semibold text-ink">Teaching Features</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {features.map((feature) => (
              <span key={feature} className="rounded-full bg-soft px-4 py-3 text-sm font-bold text-blue">{feature}</span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
