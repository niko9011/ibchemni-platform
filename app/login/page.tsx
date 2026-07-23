import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const user = await getCurrentUser();
  if (user?.role === "TEACHER") redirect("/admin");
  if (user) redirect("/dashboard");
  const params = searchParams;

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center px-5 py-16">
      <section className="mx-auto w-full max-w-md rounded-[2rem] card p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Student Login</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Sign in to your courses</h1>
        <p className="mt-4 leading-7 text-muted">Use the email and temporary password provided by IB chem Ni.</p>
        {params?.error ? (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{params.error}</div>
        ) : null}
        <form action="/api/auth/login" method="post" className="mt-7 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Email</span>
            <input name="email" type="email" required className="mt-2 w-full rounded-2xl border border-blue/20 bg-white px-4 py-3 outline-none focus:border-blue" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">Password</span>
            <input name="password" type="password" required className="mt-2 w-full rounded-2xl border border-blue/20 bg-white px-4 py-3 outline-none focus:border-blue" />
          </label>
          <button className="w-full rounded-full bg-blue px-5 py-3 text-sm font-bold text-white">Login</button>
        </form>
      </section>
    </main>
  );
}
