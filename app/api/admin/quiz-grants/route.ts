import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withPracticeSchema } from "@/lib/practice-schema";
import { isUnlockItem, unlockItemLabel } from "@/lib/quiz-access";

export const dynamic = "force-dynamic";

/* Teacher unlocks (or takes back) one practice set for one student. Questions only: videos and
   handouts stay with the chapter access form. */
export async function POST(request: Request) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.redirect(new URL("/login", request.url), 303);

  const formData = await request.formData();
  const userId = String(formData.get("userId") || "");
  const itemKey = String(formData.get("itemKey") || "");
  const action = String(formData.get("action") || "grant");
  const note = String(formData.get("note") || "").trim();
  const anchor = userId ? `#student-${encodeURIComponent(userId)}` : "";
  const back = new URL(`/admin${anchor}`, request.url);

  if (!userId || !isUnlockItem(itemKey)) return NextResponse.redirect(back, 303);

  let saved = false;
  try {
    saved = await withPracticeSchema(async () => {
      const student = await prisma.user.findFirst({ where: { id: userId, role: "STUDENT" }, select: { id: true } });
      if (!student) return false;

      if (action === "revoke") {
        await prisma.quizGrant.deleteMany({ where: { userId, itemKey } });
      } else {
        await prisma.quizGrant.upsert({
          where: { userId_itemKey: { userId, itemKey } },
          update: { note },
          create: { userId, itemKey, note: note || null }
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId: teacher.id,
          action: action === "revoke" ? "REVOKE_PRACTICE" : "GRANT_PRACTICE",
          target: `${userId}:${itemKey}`,
          note: `${unlockItemLabel(itemKey)}${note ? " · " + note : ""}`
        }
      });
      return true;
    });
  } catch (error) {
    // shown as a notice on the admin page: doing nothing would look like a lost click
    return NextResponse.redirect(new URL(`/admin?unlockFailed=1${anchor}`, request.url), 303);
  }

  return NextResponse.redirect(back, 303);
}
