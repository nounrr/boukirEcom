export type InvoiceSeller = {
  name: string
  brandLine2?: string
  activityLine?: string
  legalForm?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
  phone2?: string
  servicePhone?: string
  email?: string
  website?: string
  ice?: string
  if?: string
  rc?: string
  patente?: string
  cnss?: string
  capital?: string
}

const env = (key: string) => {
  const value = (process.env as any)?.[key]
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

/**
 * Seller (merchant) identity printed on the invoice.
 *
 * Fill these using NEXT_PUBLIC_* env vars so it works on the client.
 * Example:
 * - NEXT_PUBLIC_INVOICE_SELLER_NAME="BOUKIR SARL"
 * - NEXT_PUBLIC_INVOICE_SELLER_ICE="001234567890123"
 */
export const INVOICE_SELLER: InvoiceSeller = {
  name: env("NEXT_PUBLIC_INVOICE_SELLER_NAME") ?? "BOUKIR DIAMOND",
  brandLine2: env("NEXT_PUBLIC_INVOICE_SELLER_BRAND_LINE2") ?? "CONSTRUCTION STORE",
  activityLine:
    env("NEXT_PUBLIC_INVOICE_SELLER_ACTIVITY_LINE") ??
    "Vente de Matériaux de Construction céramique, et de Marbre",
  legalForm: env("NEXT_PUBLIC_INVOICE_SELLER_LEGAL_FORM"),
  addressLine1:
    env("NEXT_PUBLIC_INVOICE_SELLER_ADDRESS_LINE1") ??
    "IKAMAT REDOUAN 1 AZIB HAJ KADDOUR LOCAL 1 ET N2 - TANGER",
  addressLine2: env("NEXT_PUBLIC_INVOICE_SELLER_ADDRESS_LINE2"),
  city: env("NEXT_PUBLIC_INVOICE_SELLER_CITY"),
  postalCode: env("NEXT_PUBLIC_INVOICE_SELLER_POSTAL_CODE"),
  country: env("NEXT_PUBLIC_INVOICE_SELLER_COUNTRY") ?? "Maroc",
  phone: env("NEXT_PUBLIC_INVOICE_SELLER_PHONE") ?? "0650812894",
  phone2: env("NEXT_PUBLIC_INVOICE_SELLER_PHONE2") ?? "0666216657",
  servicePhone: env("NEXT_PUBLIC_INVOICE_SELLER_SERVICE_PHONE") ?? "06.66.21.66.57",
  email: env("NEXT_PUBLIC_INVOICE_SELLER_EMAIL") ?? "boukir.diamond23@gmail.com",
  website: env("NEXT_PUBLIC_INVOICE_SELLER_WEBSITE"),
  ice: env("NEXT_PUBLIC_INVOICE_SELLER_ICE"),
  if: env("NEXT_PUBLIC_INVOICE_SELLER_IF"),
  rc: env("NEXT_PUBLIC_INVOICE_SELLER_RC"),
  patente: env("NEXT_PUBLIC_INVOICE_SELLER_PATENTE"),
  cnss: env("NEXT_PUBLIC_INVOICE_SELLER_CNSS"),
  capital: env("NEXT_PUBLIC_INVOICE_SELLER_CAPITAL"),
}
