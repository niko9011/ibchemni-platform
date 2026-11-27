/* Access-code bridge between the platform (purchased chapters) and the embedded
   ib-quiz-platform app. The quiz unlocks chapters from an IBQ code, so the server
   builds one for the signed-in student from their active enrollments.
   Quiz chapter ids: SL topical = new-syllabus units (u1a..u10, p2u*), HL topical = hch*/hp2ch*,
   plus the teacher's own topical sets (ns*/nr*/no*, with a "-sq" twin for the structured part). */

const SUBJECT_TO_QUIZ_SL: Record<string, string[]> = {
  "matter-and-atomic-structure": ["u1a", "p2u1a", "ns1a", "ns1a-sq"],
  "mole-and-stoichiometry": ["u1b", "p2u1b", "ns1b", "ns1b-sq"],
  "chemical-bonding": ["u2", "p2u2", "ns2sl", "ns2sl-sq"],
  "periodic-trends": ["u3", "p2u3", "ns31sl", "ns31sl-sq"],
  "organic-structure": ["u4", "p2u4", "norgstsl", "norgstsl-sq"],
  "thermochemistry": ["u5", "p2u5", "nr1sl", "nr1sl-sq"],
  "kinetics": ["u6", "p2u6", "nr22sl", "nr22sl-sq"],
  "chemical-equilibrium": ["u7", "p2u7", "nr23sl", "nr23sl-sq"],
  "acid-and-base": ["u8", "p2u8", "nr31sl", "nr31sl-sq"],
  "redox": ["u9", "p2u9", "nr32sl", "nr32sl-sq"],
  "organic-reactions": ["u10", "p2u10", "norgrxsl", "norgrxsl-sq"]
};

const SUBJECT_TO_QUIZ_HL: Record<string, string[]> = {
  "matter-and-atomic-structure": ["hch2", "hp2ch2", "ns31s1hl", "ns31s1hl-sq"],
  "mole-and-stoichiometry": ["hch1", "hp2ch1"],
  "chemical-bonding": ["hch4", "hp2ch4", "ns2hl", "ns2hl-sq"],
  "periodic-trends": ["hch3", "hp2ch3", "ns31s1hl", "ns31s1hl-sq"],
  "organic-structure": ["hch10", "hp2ch10", "norghl", "norghl-sq"],
  "thermochemistry": ["hch5", "hp2ch5", "nr1hl", "nr1hl-sq"],
  "kinetics": ["hch6", "hp2ch6", "nr22hl", "nr22hl-sq"],
  "chemical-equilibrium": ["hch7", "hp2ch7", "nr23hl", "nr23hl-sq"],
  "acid-and-base": ["hch8", "hp2ch8", "nr31hl", "nr31hl-sq"],
  "redox": ["hch9", "hp2ch9", "nr32hl", "nr32hl-sq"],
  "organic-reactions": ["hp2ch10", "norghl", "norghl-sq"]
};

/** Quiz chapter ids unlocked by owning the given chapter product (level + slug). */
export function quizChapterIdsFor(level: string, slug: string): string[] {
  const table = level === "HL" ? SUBJECT_TO_QUIZ_HL : SUBJECT_TO_QUIZ_SL;
  return table[slug] || [];
}

function b64urlEnc(s: string): string {
  return Buffer.from(s, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function hash6(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Mirrors teacher.html's code generator: IBQ.<b64url({c,a})>.<djb2x36>. */
export function buildQuizAccessCode(cls: string, allow: string[]): string {
  const payload = JSON.stringify({ c: cls, a: allow });
  return "IBQ." + b64urlEnc(payload) + "." + hash6(payload);
}
