"use client";

import { useState } from "react";

export default function ExamSprintPage() {
  const [tab, setTab] = useState<"p1b" | "p2">("p1b");

  return (
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-5 sm:py-10">
      <div className="mb-4 px-2">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue">Final Exam Sprint</p>
        <h1 className="mobile-title mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Exam Sprint: Paper 1B &amp; Paper 2</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          Targeted training for the papers students fear most. Paper 1B data-response questions with
          official mark schemes, and full Paper 2 structured practice — mark yourself like an examiner
          and see exactly where the marks are lost.
        </p>
      </div>
      <div className="mb-4 flex gap-2 px-2">
        <button
          onClick={() => setTab("p1b")}
          className={`min-h-12 rounded-full px-5 py-3 text-sm font-bold ${tab === "p1b" ? "bg-blue text-white" : "border border-blue/20 bg-white text-muted"}`}
        >
          Paper 1B Sprint · data &amp; practical
        </button>
        <button
          onClick={() => setTab("p2")}
          className={`min-h-12 rounded-full px-5 py-3 text-sm font-bold ${tab === "p2" ? "bg-blue text-white" : "border border-blue/20 bg-white text-muted"}`}
        >
          Paper 2 Sprint · structured questions
        </button>
      </div>
      <iframe
        key={tab}
        title={tab === "p1b" ? "Paper 1B sprint" : "Paper 2 sprint"}
        src={`/ib-quiz-platform/index.html?entry=exam-sprint-${tab}#${tab}`}
        className="h-[calc(100vh-260px)] min-h-[720px] w-full rounded-[1.5rem] border border-blue/10 bg-white"
        loading="lazy"
      />
    </main>
  );
}
