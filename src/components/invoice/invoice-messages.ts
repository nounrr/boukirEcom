import type { AbstractIntlMessages } from "next-intl"

export async function loadInvoiceMessages(locale: string): Promise<AbstractIntlMessages> {
  switch (locale) {
    case "fr":
      return (await import("@/messages/fr.json")).default as AbstractIntlMessages
    case "en":
      return (await import("@/messages/en.json")).default as AbstractIntlMessages
    case "zh":
      return (await import("@/messages/zh.json")).default as AbstractIntlMessages
    case "ar":
      return (await import("@/messages/ar.json")).default as AbstractIntlMessages
    default:
      return (await import("@/messages/fr.json")).default as AbstractIntlMessages
  }
}
