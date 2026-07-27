"use client";

import { useRef, useState } from "react";
import { savePhotoFromFile, deletePhoto, usePhoto } from "@/app/lib/photos";

interface PickerProps {
  photoId: string | null | undefined;
  onChange: (photoId: string | null) => void;
}

/** Large property-photo picker shown on the Deal Analyzer. */
export function MainPhotoPicker({ photoId, onChange }: PickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const dataUrl = usePhoto(photoId);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const newPhotoId = await savePhotoFromFile(file, "main");
      await deletePhoto(photoId);
      onChange(newPhotoId);
    } catch {
      window.alert("Couldn't read that image — try a JPG or PNG.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    await deletePhoto(photoId);
    onChange(null);
  }

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      {dataUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-700 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="Property"
            className="w-full h-44 sm:h-52 object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 p-2 bg-gradient-to-t from-slate-950/80 to-transparent">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-900/80 text-slate-200 border border-slate-700 hover:border-accent-500 transition"
            >
              {busy ? "Saving…" : "Replace"}
            </button>
            <button
              onClick={handleRemove}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-900/80 text-red-400 border border-slate-700 hover:border-red-500 transition"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full h-24 rounded-lg border-2 border-dashed border-slate-700 hover:border-accent-600 text-slate-500 hover:text-accent-400 transition flex flex-col items-center justify-center gap-1"
        >
          <span className="text-xl leading-none">📷</span>
          <span className="text-xs font-medium">
            {busy ? "Saving…" : "Add property photo"}
          </span>
        </button>
      )}
    </div>
  );
}

/** Compact per-line-item photo button for the Scope Builder. */
export function ItemPhotoButton({ photoId, onChange }: PickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const dataUrl = usePhoto(photoId);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const newPhotoId = await savePhotoFromFile(file, "item");
      await deletePhoto(photoId);
      onChange(newPhotoId);
    } catch {
      window.alert("Couldn't read that image — try a JPG or PNG.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    await deletePhoto(photoId);
    onChange(null);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      {dataUrl ? (
        <span className="relative inline-block group shrink-0">
          <button
            onClick={() => inputRef.current?.click()}
            title="Replace photo"
            className="block w-9 h-9 rounded-md overflow-hidden border border-slate-600 hover:border-accent-500 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="" className="w-full h-full object-cover" />
          </button>
          <button
            onClick={handleRemove}
            title="Remove photo"
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-800 border border-slate-600 text-red-400 text-[9px] leading-none flex items-center justify-center hover:bg-red-900 transition"
          >
            ✕
          </button>
        </span>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          title="Add a photo of this item"
          className="shrink-0 w-9 h-9 rounded-md border border-dashed border-slate-700 text-slate-600 hover:border-accent-600 hover:text-accent-400 transition text-sm"
        >
          {busy ? "…" : "📷"}
        </button>
      )}
    </>
  );
}
