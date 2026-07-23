import bcrypt from "bcryptjs";
import { PrismaClient, ResourceType } from "@prisma/client";
import { chapterProducts, productId, sectionTitles } from "@/lib/products";

export async function seedInitialData(prisma: PrismaClient) {
  const teacherEmail = process.env.TEACHER_EMAIL || "ibchemistryni@163.com";
  const teacherPassword = process.env.TEACHER_PASSWORD || "change-this-password";
  const passwordHash = await bcrypt.hash(teacherPassword, 12);

  await prisma.user.upsert({
    where: { email: teacherEmail },
    update: { passwordHash, role: "TEACHER", name: "IB chem Ni" },
    create: { email: teacherEmail, passwordHash, role: "TEACHER", name: "IB chem Ni" }
  });

  for (const [slug, chapterNo, title, slPrice] of chapterProducts) {
    for (const level of ["SL", "HL"] as const) {
      const id = productId(level, slug);
      const priceCny = slPrice + (level === "HL" ? 500 : 0);

      await prisma.product.upsert({
        where: { id },
        update: {
          level,
          chapterNo,
          title,
          priceCny,
          description: `${level} chapter course for ${title}.`
        },
        create: {
          id,
          level,
          chapterNo,
          title,
          priceCny,
          description: `${level} chapter course for ${title}.`
        }
      });

      for (const [index, sectionTitle] of sectionTitles.entries()) {
        const section = await prisma.section.upsert({
          where: { productId_order: { productId: id, order: index + 1 } },
          update: { title: sectionTitle },
          create: { productId: id, order: index + 1, title: sectionTitle }
        });

        await upsertSectionResource(prisma, id, section.id, ResourceType.VIDEO, `${sectionTitle} Video`, index === 0);
        await upsertSectionResource(prisma, id, section.id, ResourceType.BLANK_HANDOUT, `${sectionTitle} Blank Handout`, false);
        await upsertSectionResource(prisma, id, section.id, ResourceType.COMPLETED_HANDOUT, `${sectionTitle} Completed Handout`, false);
      }

      await upsertChapterResource(prisma, id, ResourceType.CHECKPOINT_LIST, "Checkpoint List");
      await upsertChapterResource(prisma, id, ResourceType.PAST_PAPER, "Past Paper Questions");
      await upsertChapterResource(prisma, id, ResourceType.CONDENSED_NOTES, "Condensed Notes");
    }
  }
}

async function upsertSectionResource(
  prisma: PrismaClient,
  productIdValue: string,
  sectionId: string,
  type: ResourceType,
  title: string,
  isPreview: boolean
) {
  const existing = await prisma.resource.findFirst({ where: { productId: productIdValue, sectionId, type, title } });
  if (existing) {
    await prisma.resource.update({ where: { id: existing.id }, data: { isPreview } });
    return;
  }
  await prisma.resource.create({
    data: { productId: productIdValue, sectionId, type, title, isPreview }
  });
}

async function upsertChapterResource(prisma: PrismaClient, productIdValue: string, type: ResourceType, title: string) {
  const existing = await prisma.resource.findFirst({ where: { productId: productIdValue, sectionId: null, type, title } });
  if (existing) return;
  await prisma.resource.create({
    data: { productId: productIdValue, type, title }
  });
}
