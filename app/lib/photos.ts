"use client";

import { useEffect, useState } from "react";
import { newId } from "./scopeTemplate";

// Photos live in IndexedDB (localStorage's ~5MB cap is too small for images).
// Each record: { id: string, dataUrl: string } — a compressed JPEG data URL.

const DB_NAME = "flipos-photos";
const STORE = "photos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getPhoto(id: string): Promise<string | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result?.dataUrl ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function putPhoto(id: string, dataUrl: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ id, dataUrl });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deletePhoto(id: string | null | undefined): Promise<void> {
  if (!id) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // best effort — an orphaned photo is harmless
  }
}

function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not read image"));
    };
    img.src = url;
  });
}

/** Compress and store a photo; returns its id. kind controls target size. */
export async function savePhotoFromFile(
  file: File,
  kind: "main" | "item"
): Promise<string> {
  const dataUrl =
    kind === "main"
      ? await compressImage(file, 1400, 0.78)
      : await compressImage(file, 900, 0.72);
  const id = `ph_${newId()}`;
  await putPhoto(id, dataUrl);
  return id;
}

/** React hook: resolves a photo id to its data URL for display. */
export function usePhoto(photoId: string | null | undefined): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!photoId) {
      setDataUrl(null);
      return;
    }
    getPhoto(photoId).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [photoId]);
  return dataUrl;
}
