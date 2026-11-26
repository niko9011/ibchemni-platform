"use client";

import { FormEvent, useState } from "react";
import { chapterProducts } from "@/lib/products";
import QuestionImageField from "./QuestionImageField";

export default function QuestionSubmitForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const image = data.get("image");
    data.delete("image");
    setBusy(true);
    setMessage(image instanceof File && image.size ? "Uploading image…" : "Submitting question…");

    try {
      if (image instanceof File && image.size) {
        const signResponse = await fetch("/api/question-media/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: "submission", fileType: image.type, fileSize: image.size })
        });
        const signed = await signResponse.json();
        if (!signResponse.ok) throw new Error(signed.error || "Could not prepare the image upload.");
        const uploadResponse = await fetch(signed.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": image.type },
          body: image
        });
        if (!uploadResponse.ok) throw new Error("The image upload failed. Please try again.");
        data.set("fileKey", signed.storageKey);
      }

      setMessage("Submitting question…");
      const response = await fetch("/api/questions/submit", { method: "POST", body: data });
      if (!response.ok) throw new Error("Could not submit your question.");
      window.location.assign("/questions?submitted=1");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <select name="topic" required className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
        <option value="">Choose chapter</option>
        {chapterProducts.map(([, chapterNo, title]) => (
          <option key={chapterNo} value={title}>{chapterNo}. {title}</option>
        ))}
      </select>
      <textarea name="question" required placeholder="Type your question here" className="min-h-36 w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
      <QuestionImageField name="image" label="Add a question image (optional)" help="Upload a clear photo or screenshot. JPG, PNG, or WebP, up to 10 MB." />
      <button disabled={busy} className="w-full rounded-full bg-blue px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? "Please wait…" : "Submit question"}
      </button>
      {message ? <p aria-live="polite" className="text-sm font-semibold text-muted">{message}</p> : null}
    </form>
  );
}
