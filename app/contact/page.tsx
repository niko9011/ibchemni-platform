const contacts = [
  ["Email", "ibchemistryni@163.com", "Use this for course and assessment inquiries."],
  ["WeChat", "ibchemstudio", "Recommended for faster communication with parents and students."]
];

export default function ContactPage({
  searchParams
}: {
  searchParams?: { submitted?: string; error?: string };
}) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <section className="mobile-card rounded-[2rem] card p-8 md:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Assessment & Contact</p>
        <h1 className="mobile-title mt-4 text-5xl font-semibold tracking-tight text-ink">Get study advice or contact IB chem Ni.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
          For course access, free assessment, and IB Chemistry study planning, contact me through email or WeChat.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {contacts.map(([label, value, description]) => (
            <div key={label} className="rounded-3xl bg-soft p-6">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue">{label}</p>
              <p className="mt-3 break-all text-xl font-semibold text-ink sm:text-2xl">{value}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
            </div>
          ))}
        </div>

      </section>

      <section id="assessment" className="mobile-card mt-10 scroll-mt-24 rounded-[2rem] card p-8 md:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Free Assessment</p>
        <h2 className="mobile-title mt-4 text-5xl font-semibold tracking-tight text-ink">Find out what is holding you back.</h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">Complete this short form and receive personalized IB Chemistry study advice.</p>
        {searchParams?.submitted ? (
          <div className="mt-6 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-800">
            Thank you. Your assessment request has been received.
          </div>
        ) : null}
        {searchParams?.error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            Please enter the student name and email.
          </div>
        ) : null}

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
          <button className="min-h-12 rounded-full bg-blue px-6 py-4 text-sm font-bold text-white md:col-span-2">Get My Free Study Advice</button>
        </form>
      </section>
    </main>
  );
}
