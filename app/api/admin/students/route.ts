import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.redirect(new URL("/login", request.url), 303);

  const formData = await request.formData();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    return NextResponse.redirect(new URL("/admin", request.url), 303);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "STUDENT" },
    create: { name, email, passwordHash, role: "STUDENT" }
  });

  await prisma.auditLog.create({
    data: { actorId: teacher.id, action: "CREATE_STUDENT", target: email }
  });

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
