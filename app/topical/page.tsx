import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withPracticeSchema } from "@/lib/practice-schema";
import { practiceAccessForUser } from "@/lib/quiz-access";
import { chapterProducts } from "@/lib/products";

export const dynamic = "force-dynamic";
export const metadata = { title: "Topical by Chapter | IB chem Ni" };

export default async function TopicalPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Course Practice</p>
        <h1 className="mobile-title mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Topical Practice by Chapter</h1>
        <p className="mt-4 max-w-3xl leading-7 text-muted">
          Students who purchase a recorded chapter course get the chapter videos, handouts and the
          matching question bank: multiple choice with instant marking, structured questions with
          official mark schemes, and new-syllabus sets. Sign in to open the chapters unlocked for you.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a href="/login" className="min-h-12 rounded-full bg-blue px-6 py-3 text-sm font-bold text-white">Student Login</a>
          <a href="/contact" className="min-h-12 rounded-full border border-blue/20 bg-white px-6 py-3 text-sm font-bold text-muted">Ask about chapters</a>
        </div>
        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Chapter courses</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {chapterProducts.map(([, no, title, cents]) => (
              <div key={title} className="rounded-2xl border border-blue/10 bg-white/70 p-6">
                <p className="text-sm font-bold text-blue">Chapter {no}</p>
                <h3 className="mt-2 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm text-muted">SL / HL · videos, handouts and question bank</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  const products = await prisma.product.findMany({
    orderBy: [{ level: "asc" }, { chapterNo: "asc" }],
    include: { enrollments: { where: { userId: user.id, isActive: true } } }
  });
  const unlocked = products.filter((p) => p.enrollments.length > 0);
  // The embedded quiz asks /api/quiz/access for this session's rules itself, so nothing that opens
  // a chapter appears in the page or its URL any more.
  const opened = user.role === "TEACHER" ? [] : (await withPracticeSchema(() => practiceAccessForUser(user.id))).items;
  const quizSrc = "/ib-quiz-platform/index.html?entry=topical-units#topic";

  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-5 sm:py-10">
      <div className="mb-4 px-2">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Course Practice</p>
        <h1 className="mobile-title mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Topical Practice by Chapter</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          {user.role === "TEACHER"
            ? "You are signed in as the teacher: every chapter is open for you to try."
            : opened.length
              ? `Open for you: ${opened.map((item) => `${item.label}${item.origin === "teacher" ? " (unlocked by your teacher)" : ""}`).join(" · ")}. Videos and handouts of your purchased chapters stay in your dashboard.`
              : "No chapters are open for your account yet. Chapters you purchase are opened here, and IB chem Ni can open further sets for you by hand."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/my-practice" className="min-h-12 rounded-full border border-blue/20 bg-white px-5 py-3 text-sm font-bold text-ink">My practice record</a>
          <a href="/dashboard" className="min-h-12 rounded-full border border-blue/20 bg-white px-5 py-3 text-sm font-bold text-muted">My chapters</a>
        </div>
      </div>
      <iframe
        title="Topical practice"
        src={quizSrc}
        className="h-[calc(100vh-220px)] min-h-[760px] w-full rounded-[1.5rem] border border-blue/10 bg-white"
        loading="lazy"
      />
    </main>
  );
}
