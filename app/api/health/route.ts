import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: "v36-teacher-setup",
    message: "IB chem Ni platform is running."
  });
}
