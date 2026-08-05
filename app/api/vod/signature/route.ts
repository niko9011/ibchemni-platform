import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function contentInfo() {
  const audioVideoType = process.env.TENCENT_VOD_AUDIO_VIDEO_TYPE || "Transcode";

  if (audioVideoType === "RawAdaptive") {
    const definition = Number(process.env.TENCENT_VOD_ADAPTIVE_DEFINITION);
    if (!Number.isInteger(definition)) throw new Error("TENCENT_VOD_ADAPTIVE_DEFINITION is missing.");
    return { audioVideoType, rawAdaptiveDefinition: definition };
  }

  if (audioVideoType === "Transcode") {
    const definition = Number(process.env.TENCENT_VOD_TRANSCODE_DEFINITION || "100040");
    if (!Number.isInteger(definition)) throw new Error("TENCENT_VOD_TRANSCODE_DEFINITION is missing.");
    return { audioVideoType, transcodeDefinition: definition };
  }

  return { audioVideoType: "Original" };
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in to play this video." }, { status: 401 });

  const resourceId = new URL(request.url).searchParams.get("resourceId");
  if (!resourceId) return NextResponse.json({ error: "Missing resource." }, { status: 400 });

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
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

  if (!resource || resource.type !== "VIDEO" || !resource.vodFileId) {
    return NextResponse.json({ error: "Video is not available." }, { status: 404 });
  }

  if (user.role !== "TEACHER" && resource.product.enrollments.length === 0) {
    return NextResponse.json({ error: "This chapter is not unlocked." }, { status: 403 });
  }

  const appIdText = process.env.TENCENT_VOD_APP_ID || "1459516471";
  const appId = Number(appIdText);
  const playbackKey = process.env.TENCENT_VOD_PLAYBACK_KEY;
  if (!Number.isInteger(appId) || !playbackKey) {
    return NextResponse.json({ error: "Video playback is not configured yet." }, { status: 503 });
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 60 * 60;
  const psign = await new SignJWT({
    appId,
    fileId: resource.vodFileId,
    contentInfo: contentInfo(),
    currentTimeStamp: now,
    expireTimeStamp: expiresAt
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(new TextEncoder().encode(playbackKey));

  return NextResponse.json(
    { appId: appIdText, fileId: resource.vodFileId, psign },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}
