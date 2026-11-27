/* Shared by the student's practice record and the teacher's summary. */

export type AttemptRow = {
  id: string;
  userId: string;
  chapterId: string;
  chapterTitle: string;
  level: string;
  paper: string;
  score: number;
  total: number;
  createdAt: Date;
};

export type ChapterSummary = {
  chapterId: string;
  chapterTitle: string;
  level: string;
  paper: string;
  attempts: number;
  latest: AttemptRow;
  best: { score: number; total: number } | null;
};

export const ATTEMPT_SELECT = {
  id: true,
  userId: true,
  chapterId: true,
  chapterTitle: true,
  level: true,
  paper: true,
  score: true,
  total: true,
  createdAt: true
} as const;

export const LEVEL_NAMES: Record<string, string> = {
  SL: "Topical SL",
  HL: "Topical HL",
  SLP: "SL Past Papers",
  HLP: "HL Past Papers"
};

export const PAPER_NAMES: Record<string, string> = {
  MCQ: "Paper 1 MCQ",
  P2: "Paper 2",
  P1B: "Paper 1B",
  FRQ: "FRQ"
};

const ratio = (row: { score: number; total: number }) => (row.total > 0 ? row.score / row.total : 0);

/** Collapses attempts (newest first) into one line per chapter. */
export function summarizeByChapter(rows: AttemptRow[]): ChapterSummary[] {
  const byChapter = new Map<string, ChapterSummary>();
  for (const row of rows) {
    const summary = byChapter.get(row.chapterId);
    if (!summary) {
      byChapter.set(row.chapterId, {
        chapterId: row.chapterId,
        chapterTitle: row.chapterTitle,
        level: row.level,
        paper: row.paper,
        attempts: 1,
        latest: row,
        best: { score: row.score, total: row.total }
      });
      continue;
    }
    summary.attempts += 1;
    if (summary.best && ratio(row) > ratio(summary.best)) summary.best = { score: row.score, total: row.total };
  }
  return Array.from(byChapter.values());
}

/** "YYYY-MM-DD HH:mm" in China time, the same on the server and in the browser. */
export function chinaTime(value: Date): string {
  return new Date(value.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ");
}

export function marksText(score: number, total: number) {
  return `${score} / ${total}`;
}

export function percentText(score: number, total: number) {
  return total > 0 ? `${Math.round((100 * score) / total)}%` : "–";
}
