"use client"

import React, { useMemo, useState } from "react"
import { Download, Receipt } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import type { Order } from "@/types/order"
import type { User } from "@/state/slices/user-slice"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { downloadPdfFromReactElement } from "@/lib/pdf/generate-pdf-from-react"
import { InvoicePrintTemplate } from "@/components/invoice/invoice-print-template"

export function InvoiceDialog({
  order,
  user,
  triggerVariant = "outline",
  triggerText,
}: {
  order: Order
  user?: User | null
  triggerVariant?: "default" | "outline" | "ghost" | "secondary" | "link"
  triggerText?: string
}) {
  const locale = useLocale()
  const t = useTranslations("invoice")
  const toast = useToast()
  const [open, setOpen] = useState(false)
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
      await downloadPdfFromReactElement({
        element: <InvoicePrintTemplate order={order} buyer={buyer} locale={invoiceLocale} dir={invoiceDir} lang={invoiceLang} />,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm" className="gap-2">
          <Receipt className="w-4 h-4" />
          {triggerText ?? t("actions.viewInvoice")}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="p-0 sm:max-w-5xl max-h-[calc(100dvh-1.5rem)] overflow-hidden"
        dir={invoiceDir}
        lang={invoiceLang}
      >
        <div className="p-4 sm:p-5 border-b border-border/60">
          <DialogHeader className="gap-1">
            <DialogTitle>{t("dialog.title", { orderNumber: order.orderNumber })}</DialogTitle>
            <DialogDescription>
              {t("dialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button onClick={onDownload} disabled={isGenerating} className="gap-2">
              <Download className="w-4 h-4" />
              {isGenerating ? t("actions.generating") : t("actions.downloadPdf")}
            </Button>
          </div>
        </div>

        <ScrollArea className="bg-muted/30 max-h-[calc(100dvh-240px)]">
          <div className="p-4 sm:p-6 flex items-start justify-center">
            <div className="shadow-lg bg-white" style={{ width: "min(210mm, 100%)" }}>
              <InvoicePrintTemplate order={order} buyer={buyer} locale={invoiceLocale} dir={invoiceDir} lang={invoiceLang} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
