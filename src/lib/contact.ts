/**
 * Verified Boukir Diamond contact information.
 *
 * Every value below already existed in this repository (env defaults in
 * professional-store.tsx, linktree data in lib/links/team.ts, .env.example).
 * Environment variables keep precedence so deployments can override them.
 * Nothing here is invented: empty values are hidden by consumers.
 */
import { COMPANY, COMPANY_LINKS } from "@/lib/links/team"

const DEFAULT_PHONE = "0650812894"
const DEFAULT_EMAIL = "boukir.diamond23@gmail.com"
const DEFAULT_ADDRESS = "IKAMAT REDOUAN 1 AZIB HAJ KADDOUR LOCAL 1 ET N2 - TANGER"
const DEFAULT_MAP_URL =
  "https://www.google.com/maps/place/BOUKIR+DIAMOND+CONSTUCTION+STORE/@35.7532036,-5.8421462,1453m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd0b87005196739b:0xfa8dc0aeae136e27!8m2!3d35.7532036!4d-5.8421462!16s%2Fg%2F11y45mc9yr?entry=ttu"
/** Confirmed business WhatsApp destination (master brief §11). */
const DEFAULT_WHATSAPP = "+212650812894"

function firstPhone(raw: string): string {
  const match = raw.match(/\+?\d[\d\s().-]{6,}\d/)
  return (match?.[0] ?? "").trim()
}

/** Normalises a Moroccan/international number to wa.me digits (no +, no leading 0). */
export function toWhatsappDigits(raw: string): string | null {
  const candidate = firstPhone(raw || "")
  if (!candidate) return null
  let digits = candidate.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("0") && digits.length >= 9 && digits.length <= 10) digits = `212${digits.slice(1)}`
  return digits.length >= 8 ? digits : null
}

const phoneDisplay = (process.env.NEXT_PUBLIC_STORE_PHONE || process.env.NEXT_PUBLIC_STORE_PHONES || DEFAULT_PHONE).trim()

export const CONTACT = {
  name: "Boukir Diamond",
  legalName: "Boukir Diamond Construction Store",
  city: COMPANY.city,
  phoneDisplay,
  phoneHref: `tel:${firstPhone(phoneDisplay).replace(/[^\d+]/g, "")}`,
  email: (process.env.NEXT_PUBLIC_STORE_EMAIL || DEFAULT_EMAIL).trim(),
  address: (process.env.NEXT_PUBLIC_STORE_ADDRESS || DEFAULT_ADDRESS).trim(),
  hours: (process.env.NEXT_PUBLIC_STORE_HOURS || COMPANY.hours || "").trim(),
  mapUrl: (process.env.NEXT_PUBLIC_STORE_MAP_URL || DEFAULT_MAP_URL).trim(),
  whatsappDigits: toWhatsappDigits(process.env.NEXT_PUBLIC_WHATSAPP_PHONE || DEFAULT_WHATSAPP),
  socials: COMPANY_LINKS.filter((link) => link.kind === "facebook" || link.kind === "instagram"),
  reviewUrl: COMPANY_LINKS.find((link) => link.kind === "maps")?.href ?? null,
} as const

/**
 * Builds a WhatsApp deep link. The message is only prefilled — nothing is
 * sent until the user explicitly presses "send" inside WhatsApp. Never pass
 * session data, tokens or personal details here.
 */
export function whatsappHref(message?: string): string | null {
  if (!CONTACT.whatsappDigits) return null
  const base = `https://wa.me/${CONTACT.whatsappDigits}`
  return message ? `${base}?text=${encodeURIComponent(message.slice(0, 1800))}` : base
}
