const SOURCES = ["Google Safe Browsing", "VirusTotal", "URLScan", "AI reasoning"];

export function TrustStrip() {
  return (
    <section className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-7 sm:flex-row sm:justify-between">
        <p className="text-sm font-medium text-slate-500">
          Every link is cross-checked against trusted threat intelligence:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm font-semibold text-slate-700">
          {SOURCES.map((source, i) => (
            <span key={source} className="flex items-center gap-x-7">
              {source}
              {i < SOURCES.length - 1 ? <span className="text-slate-300">•</span> : null}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
