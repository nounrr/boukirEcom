"use client"

import React, { useMemo, useState } from "react"
import { Download } from "lucide-react"
import type { VariantProps } from "class-variance-authority"
import { useLocale, useTranslations } from "next-intl"
import { NextIntlClientProvider } from "next-intl"

import type { Order } from "@/types/order"
import type { User } from "@/state/slices/user-slice"

import { Button, buttonVariants } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { downloadPdfFromReactElement } from "@/lib/pdf/generate-pdf-from-react"
import { InvoicePrintTemplate } from "@/components/invoice/invoice-print-template"
import { loadInvoiceMessages } from "@/components/invoice/invoice-messages"

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"]
type ButtonSize = VariantProps<typeof buttonVariants>["size"]

export function InvoicePdfButton({
  order,
  user,
  variant = "outline",
  size = "sm",
  className,
}: {
  order: Order
  user?: User | null
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) {
  const locale = useLocale()
  const t = useTranslations("invoice")
  const toast = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const invoiceLocale = locale === "ar" ? "fr" : locale
  const invoiceDir: "ltr" | "rtl" = locale === "ar" ? "ltr" : "ltr"
  const invoiceLang = locale === "ar" ? "fr" : locale

  const buyer = useMemo(() => {
    const isCompany = !!user?.is_company
    const composedName = `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim()
    const fullName = (user?.nom_complet ?? composedName) || order.customerName
    return {
      fullName,
      email: user?.email ?? order.customerEmail,
      phone: user?.telephone ?? order.customerPhone ?? undefined,
      isCompany,
      companyName: isCompany ? user?.societe ?? undefined : undefined,
      ice: isCompany ? user?.ice ?? undefined : undefined,
      addressLine1: user?.shipping_address_line1 ?? undefined,
      addressLine2: user?.shipping_address_line2 ?? undefined,
      city: user?.shipping_city ?? undefined,
      postalCode: user?.shipping_postal_code ?? undefined,
      country: user?.shipping_country ?? undefined,
    }
  }, [order.customerEmail, order.customerName, order.customerPhone, user])

  const fileName = useMemo(() => {
    const d = new Date(order.createdAt)
    const datePart = Number.isNaN(d.getTime()) ? "" : `_${d.toISOString().slice(0, 10)}`
    return `${t("fileNamePrefix")}${order.orderNumber}${datePart}.pdf`
  }, [order.createdAt, order.orderNumber])

  const onDownload = async () => {
    try {
      setIsGenerating(true)

      const messages = await loadInvoiceMessages(invoiceLocale)

      await downloadPdfFromReactElement({
        element: (
          <NextIntlClientProvider locale={invoiceLocale} messages={messages}>
            <InvoicePrintTemplate order={order} buyer={buyer} locale={invoiceLocale} dir={invoiceDir} lang={invoiceLang} />
          </NextIntlClientProvider>
        ),
        fileName,
        paper: "a4",
      })
    } catch (e: any) {
      console.error("Invoice PDF generation failed", e)
      toast.error(t("toast.errorTitle"), {
        description: e?.message || t("toast.errorDesc"),
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onDownload}
      disabled={isGenerating}
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      {isGenerating ? t("actions.generating") : t("actions.invoicePdf")}
    </Button>
  )
}
