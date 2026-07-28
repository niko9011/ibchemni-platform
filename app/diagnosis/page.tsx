export default function DiagnosisPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <section className="rounded-[2rem] card p-8 md:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Free Assessment</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-ink">Find out what is holding you back.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">Complete a short form and receive personalized IB Chemistry study advice from IB chem Ni.</p>

        <form action="/api/diagnosis" method="post" className="mt-8 grid gap-4 md:grid-cols-2">
          <input name="studentName" placeholder="Student name" required className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
          <input name="email" type="email" placeholder="Email" required className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
          <input name="school" placeholder="School" className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
          <input name="gradeLevel" placeholder="Grade level" className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
          <select name="courseLevel" className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
            <option value="">SL or HL</option>
            <option value="SL">SL</option>
            <option value="HL">HL</option>
            <option value="Not sure">Not sure</option>
          </select>
          <input name="examDate" placeholder="Exam date" className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
          <input name="currentGrade" placeholder="Current grade" className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
          <input name="targetGrade" placeholder="Target grade" className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
          <input name="difficultTopics" placeholder="Most difficult topics" className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue md:col-span-2" />
          <input name="iaStatus" placeholder="IA status" className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
          <input name="weeklyStudyTime" placeholder="Weekly study time" className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
          <textarea name="message" placeholder="Anything else you want me to know" className="min-h-32 rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue md:col-span-2" />
          <button className="rounded-full bg-blue px-6 py-4 text-sm font-bold text-white md:col-span-2">Get My Free Study Advice</button>
        </form>
      </section>
    </main>
  );
}
