import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function inspectUrl(value: string | undefined) {
  if (!value) return { exists: false, startsCorrectly: false, length: 0 };
  return {
    exists: true,
    startsCorrectly: value.startsWith("postgresql://") || value.startsWith("postgres://"),
    length: value.length,
    startsWith: value.slice(0, 14)
  };
}

export async function GET(request: Request) {
  const setupToken = process.env.SETUP_TOKEN;
  const token = new URL(request.url).searchParams.get("token");
  if (!setupToken || token !== setupToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    version: "v14-env-check",
    databaseUrl: inspectUrl(process.env.DATABASE_URL),
    databaseUrlUnpooled: inspectUrl(process.env.DATABASE_URL_UNPOOLED),
    teacherEmailExists: Boolean(process.env.TEACHER_EMAIL),
    teacherPasswordExists: Boolean(process.env.TEACHER_PASSWORD),
    sessionSecretExists: Boolean(process.env.SESSION_SECRET),
    setupTokenExists: Boolean(process.env.SETUP_TOKEN)
  });
}
