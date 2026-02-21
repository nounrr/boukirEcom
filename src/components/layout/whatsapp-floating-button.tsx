"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const WHATSAPP_ICON_URL = "https://cdn.simpleicons.org/whatsapp/ffffff"

function extractFirstPhoneCandidate(input: string): string {
  const text = (input || "").trim()
  if (!text) return ""

  // Match the first plausible phone chunk (keeps optional leading +).
  // Examples it can handle:
  // - "+212 6 50 81 28 94"
  // - "GSM: 0650812894 - Tél: 0666216657"
  const match = text.match(/\+?\d[\d\s().\-]{6,}\d/)
  return (match?.[0] ?? "").trim()
}

function normalizeWhatsappNumber(raw: string): string | null {
  const candidate = extractFirstPhoneCandidate(raw)
  if (!candidate) return null

  let digits = candidate.replace(/[^0-9]/g, "")
  if (!digits) return null

  // Convert 00-prefix to international format.
  if (digits.startsWith("00")) digits = digits.slice(2)

  // Common Morocco local format (0XXXXXXXXX) -> 212XXXXXXXXX
  // Only apply when it clearly looks like a local mobile/landline.
  if (digits.startsWith("0") && digits.length >= 9 && digits.length <= 10) {
    digits = `212${digits.slice(1)}`
  }

  // WhatsApp requires an international number without + or leading zeros.
  return digits.length >= 8 ? digits : null
}

function getWhatsappHref(): string | null {
  const raw =
    (process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
      process.env.NEXT_PUBLIC_STORE_PHONE ||
      process.env.NEXT_PUBLIC_STORE_PHONES ||
      "").trim()

  const number = normalizeWhatsappNumber(raw)
  if (!number) return null
  return `https://wa.me/${number}`
}

export function WhatsAppFloatingButton({
  className,
}: {
  className?: string
}) {
  const href = getWhatsappHref()
  if (!href) return null

  return (
    <div className={cn("fixed bottom-4 left-4 z-60 sm:bottom-6 sm:left-6", className)}>
      <Button
        asChild
        size="lg"
        className={cn(
          // Mobile-first: large icon-only tap target; show label on sm+.
          "h-12 w-12 px-0 sm:h-11 sm:w-auto sm:px-4",
          "rounded-full shadow-lg ring-1 ring-border/40",
          "gap-0 sm:gap-2",
          // WhatsApp-like styling.
          "bg-emerald-600 text-white hover:bg-emerald-700",
        )}
      >
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          title="WhatsApp"
        >
          <img
            src={WHATSAPP_ICON_URL}
            alt=""
            aria-hidden="true"
            className="h-6 w-6 sm:h-5 sm:w-5"
            loading="eager"
            decoding="async"
          />
          <span className="hidden sm:inline text-sm font-semibold">WhatsApp</span>
          <span className="sr-only">WhatsApp</span>
        </a>
      </Button>
    </div>
  )
}
