import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCosPresignedUrl } from "@/lib/tencent-cos";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", _request.url));

  const resource = await prisma.resource.findUnique({
    where: { id: params.id },
    include: {
      product: {
        include: {
          enrollments: {
            where: { userId: user.id, isActive: true },
            select: { id: true }
          }
        }
      }
    }
  });

  if (!resource || resource.type === "VIDEO" || !resource.storageKey) {
    return NextResponse.json({ error: "PDF is not available." }, { status: 404 });
  }
  if (user.role !== "TEACHER" && resource.product.enrollments.length === 0) {
    return NextResponse.json({ error: "This chapter is not unlocked." }, { status: 403 });
  }

  const signedUrl = createCosPresignedUrl("GET", resource.storageKey, 5 * 60);
  return NextResponse.redirect(signedUrl, { status: 307 });
}

