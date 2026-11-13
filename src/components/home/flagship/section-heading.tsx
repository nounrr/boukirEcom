import type { ReactNode } from "react"
import { KineticHeading } from "@/components/motion/kinetic-heading"
import { cn } from "@/lib/utils"

/** Editorial section header shared by every homepage scene. */
export function SectionHeading({
  kicker,
  title,
  description,
  action,
  tone = "auto",
  className,
  id,
}: {
  kicker: string
  title: string
  description?: string
  action?: ReactNode
  tone?: "auto" | "dark"
  className?: string
  id?: string
}) {
  return (
    <div className={cn("grid items-end gap-6 md:grid-cols-[1fr_auto]", className)}>
      <div className="min-w-0">
        <p className={cn("kicker flex items-center gap-3", tone === "dark" && "!text-brand-yellow")} data-reveal>
          <span className={cn("h-px w-8", tone === "dark" ? "bg-brand-yellow" : "bg-[var(--accent-text)]")} aria-hidden="true" />
          {kicker}
        </p>
        <KineticHeading
          id={id}
          text={title}
          className={cn("display-lg mt-4 max-w-[20ch] text-[2.1rem] sm:text-5xl lg:text-[3.6rem]", tone === "dark" ? "text-white" : "text-foreground")}
        />
        {description ? (
          <p
            className={cn("mt-5 max-w-2xl text-base leading-relaxed", tone === "dark" ? "text-white/60" : "text-muted-foreground")}
            data-reveal
            style={{ ["--reveal-delay" as string]: "180ms" }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div data-reveal style={{ ["--reveal-delay" as string]: "240ms" }}>
          {action}
        </div>
      ) : null}
    </div>
  )
}
