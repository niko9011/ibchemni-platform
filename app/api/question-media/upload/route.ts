import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCosPresignedUrl } from "@/lib/tencent-cos";

export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in before uploading an image." }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    scope?: string;
    fileType?: string;
    fileSize?: number;
  } | null;
  const scope = body?.scope === "answer" ? "answer" : body?.scope === "submission" ? "submission" : "";
  const fileType = String(body?.fileType || "").toLowerCase();
  const fileSize = Number(body?.fileSize || 0);

  if (!scope) return NextResponse.json({ error: "Invalid upload type." }, { status: 400 });
  if (scope === "submission" && user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only student accounts can attach images to questions." }, { status: 403 });
  }
  if (scope === "answer" && user.role !== "TEACHER") {
    return NextResponse.json({ error: "Only teacher accounts can upload answer images." }, { status: 403 });
  }
  if (!allowedTypes[fileType]) {
    return NextResponse.json({ error: "Please choose a JPG, PNG, or WebP image." }, { status: 400 });
  }
  if (!Number.isFinite(fileSize) || fileSize < 1 || fileSize > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "The image must be smaller than 10 MB." }, { status: 400 });
  }

  const folder = scope === "answer" ? "question-answers" : "question-submissions";
  const storageKey = `${folder}/${user.id}/${Date.now()}-${crypto.randomUUID()}.${allowedTypes[fileType]}`;
  const uploadUrl = createCosPresignedUrl("PUT", storageKey, 10 * 60);
  return NextResponse.json({ uploadUrl, storageKey });
}
