import { cn } from "@/lib/utils";

/**
 * The IsItSafe logo image (LogoTransparent.png). `iconSize` sets the rendered
 * height in px (width scales automatically), matching where it's used —
 * 60px in the nav, 44px in the footer.
 */
export function Wordmark({
  className,
  iconSize = 60
}: {
  className?: string;
  iconSize?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/LogoTransparent.png"
      alt="IsItSafe"
      style={{ height: iconSize }}
      className={cn("w-auto", className)}
    />
  );
}
