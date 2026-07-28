import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const formData = await request.formData();
  const studentName = String(formData.get("studentName") || "").trim();
  const email = String(formData.get("email") || "").toLowerCase().trim();

  if (!studentName || !email) return NextResponse.redirect(new URL("/diagnosis", request.url), 303);

  await prisma.diagnosisRequest.create({
    data: {
      studentName,
      email,
      school: String(formData.get("school") || "").trim() || null,
      gradeLevel: String(formData.get("gradeLevel") || "").trim() || null,
      courseLevel: String(formData.get("courseLevel") || "").trim() || null,
      currentGrade: String(formData.get("currentGrade") || "").trim() || null,
      targetGrade: String(formData.get("targetGrade") || "").trim() || null,
      difficultTopics: String(formData.get("difficultTopics") || "").trim() || null,
      iaStatus: String(formData.get("iaStatus") || "").trim() || null,
      examDate: String(formData.get("examDate") || "").trim() || null,
      weeklyStudyTime: String(formData.get("weeklyStudyTime") || "").trim() || null,
      message: String(formData.get("message") || "").trim() || null
    }
  });

  return NextResponse.redirect(new URL("/diagnosis?submitted=1", request.url), 303);
}
