import { createElement, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Word-by-word masked headline reveal. Pure markup + CSS (see globals.css
 * `.kinetic`), so it works in server components and degrades to static text.
 * Words wrapped in `*asterisks*` receive the golden accent.
 */
export function KineticHeading({
  text,
  as = "h2",
  className,
  accentClassName = "text-gold",
  delay = 0,
  step = 70,
  id,
}: {
  text: string
  as?: "h1" | "h2" | "h3" | "p"
  className?: string
  accentClassName?: string
  delay?: number
  step?: number
  id?: string
}) {
  const tokens = text.split(/(\s+)/)
  let index = 0
  const children: ReactNode[] = tokens.map((token, i) => {
    if (/^\s+$/.test(token)) return " "
    const accent = /^\*.*\*[.,!?:;»]*$/.test(token)
    const clean = accent ? token.replace(/\*/g, "") : token
    const current = index++
    return (
      <span key={i} className="kinetic-word">
        <span className={accent ? accentClassName : undefined} style={{ transitionDelay: `${delay + current * step}ms` }}>
          {clean}
        </span>
      </span>
    )
  })
  return createElement(as, { id, className: cn("kinetic", className), "data-reveal": "kinetic", "aria-label": text.replace(/\*/g, "") }, children)
}
