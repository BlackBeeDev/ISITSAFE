"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cacheScreenshot } from "@/lib/screenshot-cache";

export function ScanForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Scan failed");
      }

      cacheScreenshot(data.id, data.screenshot);
      router.push(`/results/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <input
        className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base outline-none ring-emerald-600 transition focus:ring-2"
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://example.com or example.com"
        required
        type="text"
        value={url}
      />
      <Button disabled={loading} type="submit">
        <Search className="mr-2 h-4 w-4" />
        {loading ? "Scanning" : "Scan"}
      </Button>
      {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
    </form>
  );
}
