import { prisma } from "@/lib/db";
import { chapterProducts } from "@/lib/products";
import { quizChapterIdsFor } from "@/lib/quiz-code";

/* Which practice chapters a student may open, and where the permission comes from:
   purchased chapter courses (Enrollment) and sets the teacher unlocked by hand (QuizGrant).
   Everything resolves to "rules" that the embedded quiz app matches chapters against:
   a quiz chapter id, "level:<SL|HL|SLP|HLP>" or "paper:<MCQ|P2|P1B>". */

export const PRACTICE_ENTRIES = ["topical-units", "past-paper-sets", "exam-sprint-p1b", "exam-sprint-p2"] as const;
export type PracticeEntry = (typeof PRACTICE_ENTRIES)[number];

export function isPracticeEntry(value: string): value is PracticeEntry {
  return (PRACTICE_ENTRIES as readonly string[]).includes(value);
}

export type UnlockItem = { key: string; label: string; group: string };
export type OpenedItem = { key: string; label: string; origin: "purchased" | "teacher" };

const BANKS: Record<string, string[]> = {
  "bank:past-papers": ["level:SLP", "level:HLP"],
  "bank:p1b": ["paper:P1B"],
  "bank:p2": ["paper:P2"]
};

export const UNLOCK_ITEMS: UnlockItem[] = [
  ...chapterProducts.map(([slug, no, title]) => ({
    key: `topic:SL:${slug}`,
    label: `SL ${no}. ${title}`,
    group: "Topical · SL"
  })),
  ...chapterProducts.map(([slug, no, title]) => ({
    key: `topic:HL:${slug}`,
    label: `HL ${no}. ${title} (with the SL material)`,
    group: "Topical · HL"
  })),
  { key: "bank:past-papers", label: "Full past papers · every set, SL and HL", group: "Past papers" },
  { key: "bank:p1b", label: "Paper 1B sprint · SL and HL", group: "Exam sprint" },
  { key: "bank:p2", label: "Paper 2 sprint · every structured-question set", group: "Exam sprint" }
];

const ITEM_LABELS = new Map(UNLOCK_ITEMS.map((item) => [item.key, item.label]));

export function isUnlockItem(key: string): boolean {
  return ITEM_LABELS.has(key);
}

export function unlockItemLabel(key: string): string {
  return ITEM_LABELS.get(key) || key;
}

export function topicKey(level: string, productIdValue: string): string {
  return `topic:${level}:${productIdValue.replace(/^(sl|hl)-/, "")}`;
}

/** Rules opened by one item. Unknown items open nothing. */
export function rulesForItem(key: string): string[] {
  const topic = /^topic:(SL|HL):([a-z0-9-]+)$/.exec(key);
  if (topic) return quizChapterIdsFor(topic[1], topic[2]);
  return (BANKS[key] || []).slice();
}

export async function practiceAccessForUser(userId: string): Promise<{ allow: string[]; items: OpenedItem[] }> {
  const [products, grants] = await Promise.all([
    prisma.product.findMany({
      where: { enrollments: { some: { userId, isActive: true } } },
      orderBy: [{ level: "asc" }, { chapterNo: "asc" }]
    }),
    prisma.quizGrant.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
  ]);

  const items: OpenedItem[] = [
    ...grants.map((grant) => ({
      key: grant.itemKey,
      label: unlockItemLabel(grant.itemKey),
      origin: "teacher" as const
    })),
    ...products.map((product) => ({
      key: topicKey(product.level, product.id),
      label: `${product.level} ${product.chapterNo}. ${product.title}`,
      origin: "purchased" as const
    }))
  ];

  const allow = Array.from(new Set(items.flatMap((item) => rulesForItem(item.key))));
  return { allow, items };
}
