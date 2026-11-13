"use client"

import { Check, Copy, MessageCircle, Printer, RotateCcw, Share2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { whatsappHref } from "@/lib/contact"
import { cn } from "@/lib/utils"

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement("textarea")
    area.value = text
    area.style.position = "fixed"
    area.style.opacity = "0"
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  }
}

/**
 * Frontend-only estimate actions. Nothing is sent anywhere unless the user
 * explicitly chooses WhatsApp/share, and the shared text contains only the
 * estimate (no account or session data).
 */
export function CalculatorActions({
  getSummary,
  getShareUrl,
  title,
  onReset,
  className,
  compact = false,
}: {
  /** built at click time (fresh timestamp, no SSR/client mismatch) */
  getSummary: () => string
  getShareUrl: () => string
  title: string
  onReset?: () => void
  className?: string
  compact?: boolean
}) {
  const t = useTranslations("xp.tools.actions")
  const [copied, setCopied] = useState(false)
  const hasWhatsapp = whatsappHref() !== null

  const onCopy = async () => {
    const ok = await copyText(getSummary())
    if (ok) {
      setCopied(true)
      toast.success(t("copied"))
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  const onShare = async () => {
    const shareUrl = getShareUrl()
    if (navigator.share) {
      try {
        await navigator.share({ title, text: getSummary(), url: shareUrl })
        return
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return
      }
    }
    if (await copyText(shareUrl)) toast.success(t("linkCopied"))
  }

  const base =
    "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-surface px-3.5 text-[13px] font-medium text-foreground/85 transition-colors hover:border-foreground/30 hover:text-foreground"

  return (
    <div className={cn("no-print flex flex-wrap gap-2", className)}>
      {hasWhatsapp ? (
        <button
          type="button"
          onClick={() => {
            const href = whatsappHref(getSummary())
            if (href) window.open(href, "_blank", "noopener,noreferrer")
          }}
          className={cn(base, "border-[#1f9d55]/40 text-[#178048] dark:text-[#4ade80]")}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {t("whatsapp")}
        </button>
      ) : null}
      <button type="button" onClick={onCopy} className={base}>
        {copied ? <Check className="size-4 text-primary" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        {t("copy")}
      </button>
      <button type="button" onClick={onShare} className={base}>
        <Share2 className="size-4" aria-hidden="true" />
        {t("share")}
      </button>
      {!compact ? (
        <button type="button" onClick={() => window.print()} className={base}>
          <Printer className="size-4" aria-hidden="true" />
          {t("print")}
        </button>
      ) : null}
      {onReset ? (
        <button type="button" onClick={onReset} className={base}>
          <RotateCcw className="size-4" aria-hidden="true" />
          {t("reset")}
        </button>
      ) : null}
    </div>
  )
}
