"use client"

import { Moon, Sun } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { useTheme } from "./theme-provider"

/**
 * Accessible light/dark switch. The icon is rendered for both states and
 * swapped with CSS (`dark:`) so SSR markup never mismatches the client theme.
 */
export function ThemeToggle({ className, tone = "auto" }: { className?: string; tone?: "auto" | "onDark" }) {
  const { toggle } = useTheme()
  const t = useTranslations("xp.theme")

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "group relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full border transition-colors",
        tone === "onDark"
          ? "border-white/15 text-white/85 hover:border-white/30 hover:text-white"
          : "border-border text-foreground/80 hover:border-foreground/30 hover:text-foreground",
        className
      )}
    >
      <span className="sr-only dark:hidden">{t("toDark")}</span>
      <span className="sr-only hidden dark:inline">{t("toLight")}</span>
      <Sun
        aria-hidden="true"
        className="absolute size-[18px] rotate-90 scale-0 opacity-0 transition-all duration-500 ease-[var(--ease-premium)] dark:rotate-0 dark:scale-100 dark:opacity-100"
        strokeWidth={1.75}
      />
      <Moon
        aria-hidden="true"
        className="absolute size-[18px] rotate-0 scale-100 opacity-100 transition-all duration-500 ease-[var(--ease-premium)] dark:-rotate-90 dark:scale-0 dark:opacity-0"
        strokeWidth={1.75}
      />
    </button>
  )
}
