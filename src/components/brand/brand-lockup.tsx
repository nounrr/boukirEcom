import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Official Boukir Diamond logo: the white version on dark backgrounds (tone "light", the default),
 * the same logo in black on light backgrounds (tone "dark").
 */
export function BrandLockup({ compact = false, className, tone = "light" }: { compact?: boolean; className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={tone === "light" ? "/logo-white.png" : "/logo-black.png"}
        alt="Boukir Diamond"
        width={428}
        height={144}
        priority
        className={cn("w-auto object-contain", compact ? "h-9" : "h-10 lg:h-11")}
      />
    </span>
  )
}

/** Discreet faceted diamond motif — a single geometric line drawing. */
export function DiamondFacet({ className, strokeWidth = 1 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 6h72l22 26-58 62L2 32 24 6Zm-22 26h116M24 6l14 26 22 62 22-62 14-26M38 32 60 6l22 26"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        data-draw-path
      />
    </svg>
  )
}
