import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { seedInitialData } from "@/lib/seed-data";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const setupToken = process.env.SETUP_TOKEN;
  const token = new URL(request.url).searchParams.get("token");
  if (!setupToken || token !== setupToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await execFileAsync("npx", ["prisma", "db", "push", "--schema=./schema.prisma"], {
    cwd: process.cwd(),
    env: process.env
  });

  const prisma = new PrismaClient();
  await seedInitialData(prisma);
  await prisma.$disconnect();

  return NextResponse.json({ ok: true, message: "Database initialized and courses seeded." });
}
