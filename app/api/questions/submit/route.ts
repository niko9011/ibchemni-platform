import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") return NextResponse.redirect(new URL("/login", request.url), 303);

  const formData = await request.formData();
  const topic = String(formData.get("topic") || "").trim();
  const question = String(formData.get("question") || "").trim();
  const fileUrl = String(formData.get("fileUrl") || "").trim();

  if (!topic || !question) return NextResponse.redirect(new URL("/questions", request.url), 303);

  await prisma.questionSubmission.create({
    data: { studentId: user.id, topic, question, fileUrl: fileUrl || null }
  });

  return NextResponse.redirect(new URL("/questions?submitted=1", request.url), 303);
}
