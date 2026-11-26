import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCosPresignedUrl } from "@/lib/tencent-cos";

export const dynamic = "force-dynamic";

function storageKey(value: string | null) {
  return value?.startsWith("cos:") ? value.slice(4) : "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id") || "";
  let key = "";

  if (kind === "question") {
    const question = await prisma.question.findFirst({ where: { id, isPublished: true }, select: { imageUrl: true } });
    key = storageKey(question?.imageUrl || null);
  } else if (kind === "submission") {
    const user = await getCurrentUser();
    if (!user || user.role !== "TEACHER") return new NextResponse("Unauthorized", { status: 401 });
    const submission = await prisma.questionSubmission.findUnique({ where: { id }, select: { fileUrl: true } });
    key = storageKey(submission?.fileUrl || null);
  }

  if (!key) return new NextResponse("Image not found", { status: 404 });
  return NextResponse.redirect(createCosPresignedUrl("GET", key, 5 * 60), 307);
}
