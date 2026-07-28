import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.redirect(new URL("/login", request.url), 303);

  const formData = await request.formData();
  const resourceId = String(formData.get("resourceId") || "").trim();
  const vodFileId = String(formData.get("vodFileId") || "").trim();

  if (!resourceId || !/^\d+$/.test(vodFileId)) {
    return NextResponse.redirect(new URL("/admin?videoError=1#course-videos", request.url), 303);
  }

  const resource = await prisma.resource.findFirst({
    where: { id: resourceId, type: "VIDEO" },
    include: { product: true, section: true }
  });

  if (!resource) {
    return NextResponse.redirect(new URL("/admin?videoError=1#course-videos", request.url), 303);
  }

  await prisma.resource.update({
    where: { id: resource.id },
    data: { vodFileId }
  });

  await prisma.auditLog.create({
    data: {
      actorId: teacher.id,
      action: "SET_VOD_FILE",
      target: resource.id,
      note: `${resource.product.level} ${resource.product.chapterNo} · ${resource.section?.title || "Chapter"} · ${vodFileId}`
    }
  });

  return NextResponse.redirect(new URL("/admin?videoSaved=1#course-videos", request.url), 303);
}
