import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Official logo (the gold column « B » monogram) + wordmark. The wordmark is set
 * typographically so it stays crisp in both themes.
 */
export function BrandLockup({ compact = false, className, tone = "light" }: { compact?: boolean; className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image src="/logo.png" alt="" width={36} height={43} priority className="h-9 w-auto object-contain drop-shadow-[0_6px_14px_rgba(233,172,91,0.35)] lg:h-10" />
      <span className={cn("flex flex-col leading-none", compact ? "" : "hidden sm:flex")}>
        <span className={cn("text-[15px] font-extrabold tracking-[0.14em]", tone === "light" ? "text-white" : "text-foreground")}>BOUKIR</span>
        <span className="mt-1 text-[8.5px] font-semibold tracking-[0.3em] text-brand-yellow">DIAMOND</span>
      </span>
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
