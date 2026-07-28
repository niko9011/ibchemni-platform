import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.redirect(new URL("/login", request.url), 303);

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "Notes").trim();
  const topic = String(formData.get("topic") || "").trim();
  const url = String(formData.get("url") || "").trim();

  if (!title || !description || !url) return NextResponse.redirect(new URL("/admin", request.url), 303);

  await prisma.freeResource.create({
    data: { title, description, category, topic: topic || null, url }
  });

  await prisma.auditLog.create({
    data: { actorId: teacher.id, action: "CREATE_FREE_RESOURCE", target: title }
  });

  return NextResponse.redirect(new URL("/admin#resources", request.url), 303);
}
