"use client";

import { useState } from "react";
import { Send, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportAuthority } from "@/services/reporting";

type ReportPanelProps = {
  scanId: string;
  authorities: ReportAuthority[];
};

export function ReportPanel({ scanId, authorities }: ReportPanelProps) {
  const [selected, setSelected] = useState(() =>
    authorities.map((authority) => authority.id)
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitReport() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, authorityIds: selected })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Report failed");
      }

      setMessage("Report queued for the selected authorities.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Report failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleAuthority(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((authorityId) => authorityId !== id)
        : [...current, id]
    );
  }

  return (
    <section className="mt-6 rounded-md border border-red-200 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 text-red-700" />
        <div>
          <h2 className="font-semibold text-red-950">Report this unsafe link</h2>
          <p className="mt-1 text-sm text-red-900">
            Choose where this demo should queue an alert.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {authorities.map((authority) => (
          <label
            className="flex cursor-pointer gap-3 rounded-md border border-red-100 bg-white p-3"
            key={authority.id}
          >
            <input
              checked={selected.includes(authority.id)}
              className="mt-1 h-4 w-4"
              onChange={() => toggleAuthority(authority.id)}
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-medium text-slate-950">
                {authority.name}
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                {authority.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          className="bg-red-700 hover:bg-red-800"
          disabled={loading || selected.length === 0}
          onClick={submitReport}
          type="button"
        >
          <Send className="mr-2 h-4 w-4" />
          {loading ? "Queuing" : "Queue report"}
        </Button>
        {message ? <p className="text-sm text-red-950">{message}</p> : null}
      </div>
    </section>
  );
}
