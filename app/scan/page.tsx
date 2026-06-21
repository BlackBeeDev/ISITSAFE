import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { ScanProgress } from "@/components/scan-progress";

export default function ScanPage({
  searchParams
}: {
  searchParams: { url?: string };
}) {
  const url = typeof searchParams.url === "string" ? searchParams.url.trim() : "";

  if (!url) {
    redirect("/");
  }

  return (
    <>
      <SiteNav />
      <ScanProgress url={url} />
    </>
  );
}
