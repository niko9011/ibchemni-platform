import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCosPresignedUrl } from "@/lib/tencent-cos";

export const dynamic = "force-dynamic";

function safeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);
}

export async function POST(request: Request) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    action?: string;
    resourceId?: string;
    fileName?: string;
    fileSize?: number;
    storageKey?: string;
  } | null;
  const resourceId = String(body?.resourceId || "").trim();
  const resource = await prisma.resource.findFirst({
    where: { id: resourceId, type: { not: "VIDEO" } },
    include: { product: true }
  });

  if (!resource) return NextResponse.json({ error: "Choose a valid PDF resource." }, { status: 404 });

  if (body?.action === "confirm") {
    const storageKey = String(body.storageKey || "");
    const expectedPrefix = `course-resources/${resource.productId}/${resource.id}/`;
    if (!storageKey.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Invalid storage key." }, { status: 400 });
    }
    await prisma.resource.update({ where: { id: resource.id }, data: { storageKey } });
    return NextResponse.json({ ok: true });
  }

  const fileName = safeFileName(String(body?.fileName || ""));
  const fileSize = Number(body?.fileSize || 0);
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
  }
  if (!Number.isFinite(fileSize) || fileSize < 1 || fileSize > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "PDF must be smaller than 50 MB." }, { status: 400 });
  }

  const storageKey = `course-resources/${resource.productId}/${resource.id}/${Date.now()}-${fileName}`;
  const uploadUrl = createCosPresignedUrl("PUT", storageKey, 10 * 60);
  return NextResponse.json({ uploadUrl, storageKey });
}

