"use client";

import { ChangeEvent, useEffect, useState } from "react";

export type QuestionImageFieldProps = {
  name: string;
  label: string;
  help: string;
};

export default function QuestionImageField({ name, label, help }: QuestionImageFieldProps) {
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : "");
    setFileName(file?.name || "");
  }

  return (
    <div className="rounded-2xl border border-dashed border-blue/30 bg-soft/60 p-4">
      <label className="block cursor-pointer">
        <span className="block font-semibold text-ink">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-muted">{help}</span>
        <span className="mt-3 inline-flex min-h-11 items-center rounded-full border border-blue/25 bg-white px-4 py-2 text-sm font-bold text-blue">
          {fileName ? "Change image" : "Choose image"}
        </span>
        <input name={name} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} className="sr-only" />
      </label>
      {fileName ? <p className="mt-3 break-all text-sm font-medium text-muted">{fileName}</p> : null}
      {preview ? <img src={preview} alt="Selected image preview" className="mt-3 max-h-64 w-full rounded-xl bg-white object-contain" /> : null}
    </div>
  );
}
