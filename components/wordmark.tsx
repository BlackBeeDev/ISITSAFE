import { cn } from "@/lib/utils";

/**
 * The IsItSafe logo: a blue shield with a green check, plus the gradient
 * "IsItSafe" wordmark. Matches the logo used across the mockups.
 */
export function Wordmark({
  className,
  iconSize = 34,
  textClassName = "text-xl"
}: {
  className?: string;
  iconSize?: number;
  textClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid place-items-center" style={{ height: iconSize, width: iconSize }}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#397CB0"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m8.5 12.5 2.2 2.2 4.8-4.8" stroke="#7FBF4A" strokeWidth="2.1" />
        </svg>
      </span>
      <span className={cn("wordmark font-extrabold tracking-tight", textClassName)}>IsItSafe</span>
    </span>
  );
}
