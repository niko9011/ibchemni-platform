import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  organizeHlPeriodicTrendContent,
  seedHlS1Part1Videos,
  seedInitialData,
  seedPeriodicTrendVideos,
  seedProducts,
  seedTeacher
} from "@/lib/seed-data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schemaStatements = [
  `DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('TEACHER', 'STUDENT');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`,
  `DO $$ BEGIN
    CREATE TYPE "ResourceType" AS ENUM (
      'VIDEO',
      'BLANK_HANDOUT',
      'COMPLETED_HANDOUT',
      'CHECKPOINT_LIST',
      'PAST_PAPER',
      'CONDENSED_NOTES'
    );
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`,
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,
  `CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "chapterNo" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "priceCny" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "Section" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Section_productId_order_key" ON "Section"("productId", "order");`,
  `CREATE TABLE IF NOT EXISTS "Resource" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sectionId" TEXT,
    "type" "ResourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "storageKey" TEXT,
    "vodFileId" TEXT,
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "Enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_userId_productId_key" ON "Enrollment"("userId", "productId");`,
  `CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
  );`,
  `DO $$ BEGIN
    ALTER TABLE "Section" ADD CONSTRAINT "Section_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Resource" ADD CONSTRAINT "Resource_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Resource" ADD CONSTRAINT "Resource_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`,
  `DO $$ BEGIN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`,
  `CREATE TABLE IF NOT EXISTS "FreeResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "topic" TEXT,
    "url" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FreeResource_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "Question" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "writtenAnswer" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "relatedProductId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE TABLE IF NOT EXISTS "QuestionSubmission" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuestionSubmission_pkey" PRIMARY KEY ("id")
  );`,
  `DO $$ BEGIN
    ALTER TABLE "QuestionSubmission" ADD CONSTRAINT "QuestionSubmission_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`,
  `CREATE TABLE IF NOT EXISTS "DiagnosisRequest" (
    "id" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "school" TEXT,
    "gradeLevel" TEXT,
    "courseLevel" TEXT,
    "currentGrade" TEXT,
    "targetGrade" TEXT,
    "difficultTopics" TEXT,
    "iaStatus" TEXT,
    "examDate" TEXT,
    "weeklyStudyTime" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiagnosisRequest_pkey" PRIMARY KEY ("id")
  );`
];

const contentStatements = schemaStatements.slice(-5);
const questionMediaStatements = [
  `ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;`
];

export async function GET(request: Request) {
  const setupToken = process.env.SETUP_TOKEN;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!setupToken || token !== setupToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const step = url.searchParams.get("step") || "all";
  const levelParam = url.searchParams.get("level");
  const chapterParam = url.searchParams.get("chapter");
  const prisma = new PrismaClient();

  try {
    if (step === "schema" || step === "all") {
      for (const statement of schemaStatements) {
        await prisma.$executeRawUnsafe(statement);
      }
    }

    if (step === "teacher") {
      await seedTeacher(prisma);
    } else if (step === "content") {
      for (const statement of contentStatements) {
        await prisma.$executeRawUnsafe(statement);
      }
    } else if (step === "question-media") {
      for (const statement of questionMediaStatements) {
        await prisma.$executeRawUnsafe(statement);
      }
    } else if (step === "product") {
      if (levelParam !== "SL" && levelParam !== "HL") {
        return NextResponse.json({ ok: false, error: "Use level=SL or level=HL." }, { status: 400 });
      }

      const chapterNo = Number(chapterParam);
      if (!Number.isInteger(chapterNo) || chapterNo < 1 || chapterNo > 11) {
        return NextResponse.json({ ok: false, error: "Use chapter=1 to chapter=11." }, { status: 400 });
      }

      await seedProducts(prisma, levelParam, chapterNo);
    } else if (step === "products-sl") {
      await seedProducts(prisma, "SL");
    } else if (step === "products-hl") {
      await seedProducts(prisma, "HL");
    } else if (step === "vod-periodic-trends") {
      await seedPeriodicTrendVideos(prisma);
    } else if (step === "organize-hl-s31") {
      await organizeHlPeriodicTrendContent(prisma);
    } else if (step === "vod-hl-s1-part1" || step === "hl-s1-part1-resources") {
      await seedHlS1Part1Videos(prisma);
    } else if (step === "all") {
      await seedInitialData(prisma);
    } else if (step !== "schema") {
      return NextResponse.json(
        { ok: false, error: "Unknown setup step. Use schema, content, question-media, teacher, product, products-sl, products-hl, vod-periodic-trends, organize-hl-s31, vod-hl-s1-part1, hl-s1-part1-resources, or all." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      step,
      level: levelParam,
      chapter: chapterParam,
      message: `Setup step "${step}" completed.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown setup error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
