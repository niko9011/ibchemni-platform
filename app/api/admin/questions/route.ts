import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.redirect(new URL("/login", request.url), 303);

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const topic = String(formData.get("topic") || "").trim();
  const question = String(formData.get("question") || "").trim();
  const writtenAnswer = String(formData.get("writtenAnswer") || "").trim();
  const videoUrl = String(formData.get("videoUrl") || "").trim();

  if (!title || !topic || !question || !writtenAnswer) return NextResponse.redirect(new URL("/admin", request.url), 303);

  await prisma.question.create({
    data: { title, topic, question, writtenAnswer, videoUrl: videoUrl || null }
  });

  await prisma.auditLog.create({
    data: { actorId: teacher.id, action: "CREATE_QUESTION", target: title }
  });

  return NextResponse.redirect(new URL("/admin#questions", request.url), 303);
}
