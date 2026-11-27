import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { withPracticeSchema } from "@/lib/practice-schema";
import { practiceAccessForUser } from "@/lib/quiz-access";

export const dynamic = "force-dynamic";

/* What the signed-in student may practise, read by the embedded quiz app at start-up.
   Replaces the access code that used to sit in the iframe URL, which any student could copy
   and share; a session cannot be shared this way, and a revoked unlock stops working at the
   next page load. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, signedIn: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    if (user.role === "TEACHER") {
      // the teacher can try every set; the quiz app only accepts "*" for the class "TEACHER"
      return NextResponse.json(
        { ok: true, signedIn: true, cls: "TEACHER", name: user.name, allow: ["*"], items: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    const { allow, items } = await withPracticeSchema(() => practiceAccessForUser(user.id));
    return NextResponse.json(
      { ok: true, signedIn: true, cls: "STUDENT", name: user.name, allow, items },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read practice access.";
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
