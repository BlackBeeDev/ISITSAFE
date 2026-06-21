"use client";

import { useEffect, useState } from "react";
import { readCachedScreenshot } from "@/lib/screenshot-cache";

export function ScreenshotPreview({
  id,
  initialScreenshot
}: {
  id: string;
  initialScreenshot: string | null;
}) {
  const [screenshot, setScreenshot] = useState(initialScreenshot);

  useEffect(() => {
    if (screenshot) return;
    const cached = readCachedScreenshot(id);
    if (cached) setScreenshot(cached);
  }, [id, screenshot]);

  return (
    <aside className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">Screenshot</h2>
      {screenshot ? (
        <img
          alt="Screenshot preview"
          className="mt-4 aspect-video w-full rounded border object-cover"
          src={screenshot}
        />
      ) : (
        <div className="mt-4 grid aspect-video place-items-center rounded border bg-slate-100 text-sm text-slate-500">
          No screenshot captured
        </div>
      )}
    </aside>
  );
}
