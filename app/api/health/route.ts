import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: "v35-hl-s2-token-fix",
    message: "IB chem Ni platform is running."
  });
}
