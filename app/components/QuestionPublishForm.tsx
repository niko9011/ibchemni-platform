"use client";

import { FormEvent, useState } from "react";
import { chapterProducts } from "@/lib/products";
import QuestionImageField from "./QuestionImageField";

export default function QuestionPublishForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const image = data.get("image");
    data.delete("image");
    setBusy(true);
    setMessage(image instanceof File && image.size ? "Uploading image…" : "Publishing answer…");

    try {
      if (image instanceof File && image.size) {
        const signResponse = await fetch("/api/question-media/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: "answer", fileType: image.type, fileSize: image.size })
        });
        const signed = await signResponse.json();
        if (!signResponse.ok) throw new Error(signed.error || "Could not prepare the image upload.");
        const uploadResponse = await fetch(signed.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": image.type },
          body: image
        });
        if (!uploadResponse.ok) throw new Error("The image upload failed. Please try again.");
        data.set("imageKey", signed.storageKey);
      }

      setMessage("Publishing answer…");
      const response = await fetch("/api/admin/questions", { method: "POST", body: data });
      if (!response.ok) throw new Error("Could not publish the answer.");
      window.location.assign("/admin#questions");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={publish} className="mt-5 space-y-4">
      <input name="title" placeholder="Question title" required className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
      <select name="topic" required className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
        <option value="">Choose chapter</option>
        {chapterProducts.map(([, chapterNo, title]) => (
          <option key={chapterNo} value={title}>{chapterNo}. {title}</option>
        ))}
      </select>
      <textarea name="question" placeholder="Question" required className="min-h-24 w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
      <textarea name="writtenAnswer" placeholder="Written answer" required className="min-h-32 w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
      <QuestionImageField name="image" label="Add an answer image (optional)" help="Upload a diagram, worked solution, or screenshot. JPG, PNG, or WebP, up to 10 MB." />
      <input name="imageUrl" type="url" placeholder="Or paste an existing image URL" className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
      <input name="videoUrl" placeholder="Tencent VOD/MP4 video URL, optional" className="w-full rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue" />
      <button disabled={busy} className="w-full rounded-full bg-blue px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? "Please wait…" : "Publish answer"}
      </button>
      {message ? <p aria-live="polite" className="text-sm font-semibold text-muted">{message}</p> : null}
    </form>
  );
}
