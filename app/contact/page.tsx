const contacts = [
  ["Email", "ibchemistryni.com", "Use this for course and assessment inquiries."],
  ["WeChat", "ibchemstudio", "Recommended for faster communication with parents and students."]
];

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <section className="rounded-[2rem] card p-8 md:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Contact Me</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-ink">Get in touch with IB chem Ni.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
          For course access, free assessment, and IB Chemistry study planning, contact me through email or WeChat.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {contacts.map(([label, value, description]) => (
            <div key={label} className="rounded-3xl bg-soft p-6">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-blue/10 bg-white p-6">
          <h2 className="text-2xl font-semibold text-ink">Free assessment</h2>
          <p className="mt-3 leading-7 text-muted">If you are not sure where to start, submit a short diagnostic form first.</p>
          <a href="/diagnosis" className="mt-5 inline-flex rounded-full bg-blue px-5 py-3 text-sm font-bold text-white">Get Free Assessment</a>
        </div>
      </section>
    </main>
  );
}
