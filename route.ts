import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.redirect(new URL("/login", request.url), 303);

  const formData = await request.formData();
  const userId = String(formData.get("userId") || "");
  const productId = String(formData.get("productId") || "");
  const action = String(formData.get("action") || "grant");
  const note = String(formData.get("note") || "").trim();

  if (!userId || !productId) return NextResponse.redirect(new URL("/admin", request.url), 303);

  if (action === "revoke") {
    await prisma.enrollment.updateMany({
      where: { userId, productId },
      data: { isActive: false, note }
    });
  } else {
    await prisma.enrollment.upsert({
      where: { userId_productId: { userId, productId } },
      update: { isActive: true, note },
      create: { userId, productId, isActive: true, note }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: teacher.id,
      action: action === "revoke" ? "REVOKE_ACCESS" : "GRANT_ACCESS",
      target: `${userId}:${productId}`,
      note
    }
  });

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
