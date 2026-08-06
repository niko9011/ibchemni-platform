"use client";

import { FormEvent, useState } from "react";

type UploadResource = {
  id: string;
  label: string;
  storageKey: string | null;
};

function readCosError(xml: string) {
  const code = xml.match(/<Code>([^<]+)<\/Code>/)?.[1];
  const message = xml.match(/<Message>([^<]+)<\/Message>/)?.[1];
  const requestId = xml.match(/<RequestId>([^<]+)<\/RequestId>/)?.[1];
  return [code, message, requestId ? `RequestId: ${requestId}` : ""].filter(Boolean).join(" · ");
}

export default function ResourceUploader({ resources }: { resources: UploadResource[] }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const resourceId = String(form.get("resourceId") || "");
    const file = form.get("file");
    if (!(file instanceof File) || !resourceId) return;

    setBusy(true);
    setMessage("Preparing secure upload...");
    try {
      const signingResponse = await fetch("/api/admin/resources/cos-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, fileName: file.name, fileSize: file.size })
      });
      const signing = await signingResponse.json();
      if (!signingResponse.ok) throw new Error(signing.error || "Could not prepare upload.");

      setMessage("Uploading PDF directly to Tencent COS...");
      const uploadResponse = await fetch(signing.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file
      });
      if (!uploadResponse.ok) {
        const responseBody = await uploadResponse.text();
        const detail = readCosError(responseBody);
        throw new Error(`Tencent COS upload failed (${uploadResponse.status})${detail ? `: ${detail}` : "."}`);
      }

      const confirmResponse = await fetch("/api/admin/resources/cos-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", resourceId, storageKey: signing.storageKey })
      });
      const confirmation = await confirmResponse.json();
      if (!confirmResponse.ok) throw new Error(confirmation.error || "Could not save file location.");

      setMessage("PDF uploaded and protected successfully. Refreshing...");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={upload} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
      <select name="resourceId" required className="rounded-2xl border border-blue/20 px-4 py-3 outline-none focus:border-blue">
        <option value="">Choose PDF resource</option>
        {resources.map((resource) => (
          <option key={resource.id} value={resource.id}>
            {resource.storageKey ? "Uploaded · " : "Missing · "}{resource.label}
          </option>
        ))}
      </select>
      <input name="file" type="file" accept="application/pdf,.pdf" required className="rounded-2xl border border-blue/20 bg-white px-4 py-3 text-sm" />
      <button disabled={busy} className="min-h-12 rounded-full bg-blue px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
        {busy ? "Uploading..." : "Upload PDF"}
      </button>
      {message ? <p className="text-sm font-semibold text-muted md:col-span-3">{message}</p> : null}
    </form>
  );
}
