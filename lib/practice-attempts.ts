/* Validation for a practice attempt sent by the embedded quiz app.
   `saved` is the quiz app's own record of a finished attempt: { score, total, date, kind, answers, marks?, results? }. */

export const ATTEMPT_LEVELS = ["SL", "HL", "SLP", "HLP"];
export const ATTEMPT_PAPERS = ["MCQ", "P2", "P1B", "FRQ"];

export type AttemptInput = {
  chapterId: string;
  chapterTitle: string;
  level: string;
  paper: string;
  entry: string;
  score: number;
  total: number;
  saved: Record<string, unknown>;
};

const MAX_SAVED_CHARS = 64000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAttempt(body: unknown, allowedEntries: readonly string[]): AttemptInput | null {
  if (!isPlainObject(body)) return null;

  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const chapterId = text(body.chapterId, 80);
  const chapterTitle = text(body.chapterTitle, 200);
  const level = text(body.level, 8);
  const paper = text(body.paper, 8);
  const entry = text(body.entry, 40);

  if (!chapterId || !chapterTitle) return null;
  if (!(ATTEMPT_LEVELS as string[]).includes(level)) return null;
  if (!(ATTEMPT_PAPERS as string[]).includes(paper)) return null;
  if (!allowedEntries.includes(entry)) return null;

  const score = Number(body.score);
  const total = Number(body.total);
  if (!Number.isInteger(score) || !Number.isInteger(total)) return null;
  if (total < 1 || total > 500 || score < 0 || score > total) return null;

  if (!isPlainObject(body.saved)) return null;
  let savedJson: string;
  try {
    savedJson = JSON.stringify(body.saved);
  } catch {
    return null;
  }
  if (!savedJson || savedJson.length > MAX_SAVED_CHARS) return null;

  return { chapterId, chapterTitle, level, paper, entry, score, total, saved: body.saved };
}
