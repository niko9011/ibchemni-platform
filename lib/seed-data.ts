import bcrypt from "bcryptjs";
import { PrismaClient, ResourceType } from "@prisma/client";
import { chapterProducts, productId, sectionTitles } from "@/lib/products";

export async function seedInitialData(prisma: PrismaClient) {
  await seedTeacher(prisma);
  await seedProducts(prisma);
}

export async function seedTeacher(prisma: PrismaClient) {
  const teacherEmail = process.env.TEACHER_EMAIL || "ibchemistryni@163.com";
  const teacherPassword = process.env.TEACHER_PASSWORD || "change-this-password";
  const passwordHash = await bcrypt.hash(teacherPassword, 8);

  await prisma.user.upsert({
    where: { email: teacherEmail },
    update: { passwordHash, role: "TEACHER", name: "IB chem Ni" },
    create: { email: teacherEmail, passwordHash, role: "TEACHER", name: "IB chem Ni" }
  });
}

const periodicTrendVideos = [
  {
    sectionOrder: 1,
    title: "04-HL-S3.1-V01-Introduction-to-Periodic-Trends",
    vodFileId: "5001834813658987499"
  },
  {
    sectionOrder: 1,
    title: "04-HL-S3.1-V02-Atomic-Radius",
    vodFileId: "5001834813655939162"
  },
  {
    sectionOrder: 2,
    title: "04-HL-S3.1-V03-First-Ionization-Energy",
    vodFileId: "5001834813655687581"
  },
  {
    sectionOrder: 2,
    title: "04-HL-S3.1-V04-First-Ionization-Energy-Supplement",
    vodFileId: "5001834813656052337"
  }
] as const;

const transitionMetalVideos = [
  ["04-HL-S3.1-V05-Transition-Metals-Part-1", "5001834814491944537"],
  ["04-HL-S3.1-V06-Transition-Metals-Part-2", "5001834814493442184"],
  ["04-HL-S3.1-V07-Transition-Metals-Part-3", "5001834814490747146"],
  ["04-HL-S3.1-V08-Transition-Metals-Part-4", "5001834814492051032"],
  ["04-HL-S3.1-V09-Transition-Metals-Part-5", "5001834814490023126"]
] as const;

const hlPeriodicTrendChapterResources = [
  [ResourceType.BLANK_HANDOUT, "04-HL-S3.1-R01-Student-Handout"],
  [ResourceType.COMPLETED_HANDOUT, "04-HL-S3.1-R02-Completed-Handout"],
  [ResourceType.PAST_PAPER, "04-HL-S3.1-R03-Past-Paper-Questions"],
  [ResourceType.PAST_PAPER, "04-HL-S3.1-R04-Past-Paper-Mark-Scheme"]
] as const;

const hlS1Part1Videos = [
  ["01-HL-S1PART1-V1-MASS-SPECTRUM", "5001834814778647107"],
  ["01-HL-S1PART1-V2-CALCULATION", "5001834814777427496"],
  ["01-HL-S1PART1-V3-SUCCESSIVE-IONIZATION-ENERGY", "5001834814777849024"],
  ["01-HL-S1PART1-V4-DEVIATION-OF-1ST-IE", "5001834814777846587"]
] as const;

const hlS1Part1Resources = [
  [ResourceType.PAST_PAPER, "01-HL-S1PART1-R01-Past-Paper-Questions"],
  [ResourceType.PAST_PAPER, "01-HL-S1PART1-R02-Past-Paper-Mark-Scheme"],
  [ResourceType.BLANK_HANDOUT, "01-HL-S1PART1-R03-Student-Handout"],
  [ResourceType.COMPLETED_HANDOUT, "01-HL-S1PART1-R04-Completed-Handout"]
] as const;

export async function seedHlS1Part1Videos(prisma: PrismaClient) {
  await seedProducts(prisma, "HL", 1);

  const id = productId("HL", "matter-and-atomic-structure");
  const section = await prisma.section.findFirst({
    where: { productId: id, order: 1 }
  });

  if (!section) throw new Error("HL S1 Part 1 section was not created.");

  await prisma.section.update({
    where: { id: section.id },
    data: { title: "S1 Part 1 · Mass Spectrometry and Ionization Energy" }
  });

  for (const [title, vodFileId] of hlS1Part1Videos) {
    await upsertVodLesson(prisma, id, section.id, title, vodFileId);
  }

  const keepVodFileIds = hlS1Part1Videos.map((video) => video[1]);
  await prisma.resource.deleteMany({
    where: {
      productId: id,
      sectionId: section.id,
      type: ResourceType.VIDEO,
      OR: [
        { vodFileId: null },
        { vodFileId: { notIn: [...keepVodFileIds] } }
      ]
    }
  });

  const keepResourceTitles = hlS1Part1Resources.map((resource) => resource[1]);
  await prisma.resource.deleteMany({
    where: {
      productId: id,
      sectionId: section.id,
      type: { not: ResourceType.VIDEO },
      title: { notIn: [...keepResourceTitles] }
    }
  });
  for (const [type, title] of hlS1Part1Resources) {
    await upsertSectionResource(prisma, id, section.id, type, title, false);
  }
}

export async function seedPeriodicTrendVideos(prisma: PrismaClient) {
  await seedProducts(prisma, "SL", 4);
  await seedProducts(prisma, "HL", 4);

  for (const level of ["SL", "HL"] as const) {
    const id = productId(level, "periodic-trends");
    const sectionTitlesByOrder = ["Periodic Trends", "Ionization Energy", "Exam Practice", level === "HL" ? "HL Transition Metals" : "Additional Resources"];

    const sections = await prisma.section.findMany({
      where: { productId: id },
      orderBy: { order: "asc" }
    });

    for (const section of sections) {
      await prisma.section.update({
        where: { id: section.id },
        data: { title: sectionTitlesByOrder[section.order - 1] || section.title }
      });
    }

    for (const video of periodicTrendVideos) {
      const section = sections.find((item) => item.order === video.sectionOrder);
      const levelTitle = video.title.replace("04-HL-", `04-${level}-`);
      if (section) await upsertVodLesson(prisma, id, section.id, levelTitle, video.vodFileId);
    }

    if (level === "HL") {
      const transitionSection = sections.find((item) => item.order === 4);
      if (transitionSection) {
        for (const [title, vodFileId] of transitionMetalVideos) {
          await upsertVodLesson(prisma, id, transitionSection.id, title, vodFileId);
        }
      }
    }
  }
}

export async function organizeHlPeriodicTrendContent(prisma: PrismaClient) {
  await seedProducts(prisma, "HL", 4);

  const id = productId("HL", "periodic-trends");
  const sectionTitlesByOrder = [
    "Periodic Trends",
    "First Ionization Energy",
    "IB Exam Practice",
    "Transition Metals"
  ];
  const sections = await prisma.section.findMany({
    where: { productId: id },
    orderBy: { order: "asc" }
  });

  for (const section of sections) {
    await prisma.section.update({
      where: { id: section.id },
      data: { title: sectionTitlesByOrder[section.order - 1] || section.title }
    });
  }

  for (const video of periodicTrendVideos) {
    const section = sections.find((item) => item.order === video.sectionOrder);
    if (section) await upsertVodLesson(prisma, id, section.id, video.title, video.vodFileId);
  }

  const transitionSection = sections.find((item) => item.order === 4);
  if (transitionSection) {
    for (const [title, vodFileId] of transitionMetalVideos) {
      await upsertVodLesson(prisma, id, transitionSection.id, title, vodFileId);
    }
  }

  const keepVodFileIds = [
    ...periodicTrendVideos.map((video) => video.vodFileId),
    ...transitionMetalVideos.map((video) => video[1])
  ];

  // Remove generic placeholders and stale duplicates from this chapter only.
  await prisma.resource.deleteMany({
    where: {
      productId: id,
      sectionId: { not: null },
      OR: [
        { type: { not: ResourceType.VIDEO } },
        { type: ResourceType.VIDEO, vodFileId: null },
        { type: ResourceType.VIDEO, vodFileId: { notIn: keepVodFileIds } }
      ]
    }
  });

  await prisma.resource.deleteMany({ where: { productId: id, sectionId: null } });
  for (const [type, title] of hlPeriodicTrendChapterResources) {
    await prisma.resource.create({ data: { productId: id, type, title } });
  }
}

async function upsertVodLesson(
  prisma: PrismaClient,
  productIdValue: string,
  sectionId: string,
  title: string,
  vodFileId: string
) {
  const existing = await prisma.resource.findFirst({
    where: {
      productId: productIdValue,
      sectionId,
      type: ResourceType.VIDEO,
      OR: [{ vodFileId }, { title }]
    }
  });

  if (existing) {
    await prisma.resource.update({
      where: { id: existing.id },
      data: { title, vodFileId, isPreview: false }
    });
    return;
  }

  const placeholder = await prisma.resource.findFirst({
    where: {
      productId: productIdValue,
      sectionId,
      type: ResourceType.VIDEO,
      vodFileId: null
    }
  });

  if (placeholder) {
    await prisma.resource.update({
      where: { id: placeholder.id },
      data: { title, vodFileId, isPreview: false }
    });
    return;
  }

  await prisma.resource.create({
    data: {
      productId: productIdValue,
      sectionId,
      type: ResourceType.VIDEO,
      title,
      vodFileId,
      isPreview: false
    }
  });
}

export async function seedProducts(prisma: PrismaClient, onlyLevel?: "SL" | "HL", onlyChapterNo?: number) {
  for (const [slug, chapterNo, title, slPrice] of chapterProducts) {
    if (onlyChapterNo && chapterNo !== onlyChapterNo) continue;

    for (const level of ["SL", "HL"] as const) {
      if (onlyLevel && onlyLevel !== level) continue;

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
        await prisma.section.upsert({
          where: { productId_order: { productId: id, order: index + 1 } },
          update: { title: sectionTitle },
          create: { productId: id, order: index + 1, title: sectionTitle }
        });
      }
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
