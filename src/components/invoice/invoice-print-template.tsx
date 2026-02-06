"use client"

import React, { useMemo } from "react"
import { useTranslations } from "next-intl"

import type { Order, OrderItem } from "@/types/order"

export type InvoiceBuyerInfo = {
  fullName?: string
  email?: string
  phone?: string
  isCompany?: boolean
  companyName?: string
  ice?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postalCode?: string
  country?: string
}

function formatMoney(value: number, currency: string) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0
  return `${amount.toFixed(2)} ${currency}`
}

function formatDate(locale: string, value?: string | null) {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value))
  } catch {
    return value
  }
}

function safeText(value?: string | null) {
  const v = typeof value === "string" ? value.trim() : ""
  return v.length > 0 ? v : "—"
}

function formatAmount(value: number) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0
  return amount.toFixed(2)
}

function lineDiscountLabel(item: OrderItem, currency: string) {
  const pct = item.discountPercentage != null ? Number(item.discountPercentage) : 0
  const amt = item.discountAmount != null ? Number(item.discountAmount) : 0
  if (pct > 0) return `-${pct}%`
  if (amt > 0) return `-${formatMoney(amt, currency)}`
  return "—"
}

function getPaymentStatusLabel(t: (key: string) => string, status?: string | null) {
  switch (status) {
    case "pending":
      return t("paymentStatus.pending")
    case "paid":
      return t("paymentStatus.paid")
    case "failed":
      return t("paymentStatus.failed")
    case "refunded":
      return t("paymentStatus.refunded")
    default:
      return status ? String(status) : "—"
  }
}

function getPaymentMethodLabel(t: (key: string) => string, method?: string | null) {
  switch (method) {
    case "cash_on_delivery":
      return t("paymentMethod.cash_on_delivery")
    case "pay_in_store":
      return t("paymentMethod.pay_in_store")
    case "card":
      return t("paymentMethod.card")
    case "bank_transfer":
      return t("paymentMethod.bank_transfer")
    case "mobile_payment":
      return t("paymentMethod.mobile_payment")
    case "solde":
      return t("paymentMethod.solde")
    default:
      return method ? String(method) : "—"
  }
}

export function InvoicePrintTemplate({
  order,
  buyer,
  locale = "fr",
  dir = "ltr",
  lang,
}: {
  order: Order
  buyer?: InvoiceBuyerInfo
  locale?: string
  dir?: "ltr" | "rtl"
  lang?: string
}) {
  const t = useTranslations("invoice")
  const currency = t("currency")
  const dh = t("money.dh")
  const placeholder = t("placeholder")

  const seller = {
    name: "BOUKIR DIAMOND",
    subtitle: "CONSTRUCTION STORE",
    activity: "Vente de Matériaux de Construction céramique, et de Marbre",
    phones: "GSM: 0650812894 - Tél: 0666216657",
    address: "IKAMAT REDOUAN 1 AZIB HAJ KADDOUR LOCAL 1 ET N2 - TANGER",
    email: "boukir.diamond23@gmail.com",
    serviceCharge: "06.66.21.66.57",
  }

  const invoiceDate = useMemo(() => {
    const d = new Date(order.createdAt)
    if (Number.isNaN(d.getTime())) return formatDate(locale, order.createdAt)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${dd}/${mm}/${yyyy}`
  }, [locale, order.createdAt])

  const remiseUsed = Number((order as any).remiseUsedAmount || 0)
  const soldeAmount = Number((order as any).soldeAmount || 0)

  const amountToPay = useMemo(() => {
    if (order.paymentMethod === "solde" && soldeAmount > 0) return soldeAmount
    return Math.max(0, Number(order.totalAmount || 0) - remiseUsed)
  }, [order.paymentMethod, order.totalAmount, remiseUsed, soldeAmount])

  const items = order.items ?? []

  const paymentMethodLabel = getPaymentMethodLabel(t as any, order.paymentMethod)
  const paymentStatusLabel = getPaymentStatusLabel(t as any, order.paymentStatus)
  const deliveryLabel = order.deliveryMethod === "pickup" ? t("delivery.pickup") : t("delivery.delivery")

  // IMPORTANT: html2canvas currently does not support parsing `oklch()` color values.
  // Tailwind v4 uses OKLCH for many palette colors, so this template intentionally
  // uses its own CSS with hex colors and avoids Tailwind utility classes.
  const css = `
    :root{--inv-orange:#f59e0b;--inv-orange2:#fb923c;--inv-text:#0b0f19;--inv-muted:#6b7280;--inv-border:#e5e7eb;--inv-bg:#ffffff;}
    .inv-page{width:210mm;min-height:297mm;background:var(--inv-bg);color:var(--inv-text);font-family:var(--font-sans), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";display:flex;flex-direction:column;}
    .inv-pad{padding:24px 28px;flex:1;}
    .inv-header{display:grid;grid-template-columns:160px 1fr 160px;align-items:center;gap:10px;}
    .inv-logo{height:150px;width:150px;max-width:none;display:block;object-fit:contain;justify-self:start;}
    .inv-brandCenter{text-align:center;}
    .inv-brandName{font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:0.02em;}
    .inv-brandSub{font-size:16px;color:#111827;font-weight:400;text-transform:uppercase;letter-spacing:0.02em;margin-top:2px;}
    .inv-brandDesc{font-size:12px;color:#4b5563;font-style:italic;font-weight:400;margin-top:4px;}
    .inv-brandDesc2{font-size:12px;color:#4b5563;font-style:italic;font-weight:400;margin-top:4px;}
    .inv-brandAddr{font-size:12px;color:#6b7280;font-style:italic;font-weight:400;margin-top:4px;}
    .inv-lineOrange{height:2px;background:var(--inv-orange);margin-top:12px;}

    .inv-contactRow{margin-top:14px;display:flex;gap:14px;align-items:stretch;justify-content:space-between;}
    .inv-contactWrap{flex:1;min-width:0;}
    .inv-contactLabel{font-size:12px;color:#111827;font-weight:800;margin-bottom:6px;}
    .inv-contactBox{border:1px solid var(--inv-border);border-left:4px solid var(--inv-orange);border-radius:6px;padding:10px 12px;background:#fff;}
    .inv-contactGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;}
    .inv-field{font-size:11px;color:#111827;}
    .inv-fieldK{color:var(--inv-muted);font-weight:700;margin-right:6px;}
    .inv-fieldV{font-weight:800;}

    .inv-metaSimple{text-align:right;font-size:12px;color:#111827;line-height:1.35;}
    .inv-metaSimple .k{color:var(--inv-muted);font-weight:700;}
    .inv-metaSimple .v{font-weight:800;}

    .inv-tableWrap{margin-top:14px;border:1px solid var(--inv-border);border-radius:6px;overflow:hidden;}
    .inv-table{width:100%;border-collapse:collapse;}
    .inv-th{background:var(--inv-orange);color:#ffffff;font-size:11px;font-weight:900;padding:9px 10px;border-right:1px solid rgba(255,255,255,0.25);text-transform:uppercase;}
    .inv-th:last-child{border-right:none;}
    .inv-td{font-size:11px;padding:9px 10px;border-top:1px solid #f1f5f9;border-right:1px solid #f1f5f9;vertical-align:top;color:#111827;}
    .inv-td:last-child{border-right:none;}
    .inv-tdMuted{color:var(--inv-muted);font-weight:700;}
    .inv-tdStrong{font-weight:900;}
    .inv-rowAlt{background:#fff;}

    .inv-totalsRow{margin-top:12px;display:flex;align-items:flex-start;justify-content:flex-end;}
    .inv-totalGeneral{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:900;}
    .inv-totalGeneralLabel{color:#111827;letter-spacing:0.02em;}
    .inv-totalGeneralValue{min-width:140px;text-align:right;}

    .inv-details{margin-top:12px;border:1px solid var(--inv-border);border-radius:6px;background:#fff;padding:10px 12px;}
    .inv-detailsTitle{font-size:11px;font-weight:900;color:#111827;margin-bottom:6px;text-transform:uppercase;}
    .inv-detailsGrid{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;font-size:11px;color:#111827;}
    .inv-detailsGrid .k{color:var(--inv-muted);font-weight:800;}
    .inv-detailsGrid .v{font-weight:900;}

    .inv-footer{padding:10px 28px 14px 28px;border-top:1px solid var(--inv-border);text-align:center;margin-top:auto;}
    .inv-footerLine{font-size:11px;color:#111827;font-weight:400;}
    .inv-footerLine2{font-size:11px;color:#111827;font-weight:400;margin-top:4px;}
    .inv-footerLine3{font-size:11px;color:#111827;font-weight:400;margin-top:4px;}
  `

  return (
    <div className="inv-page" dir={dir} lang={lang ?? locale}>
      <style>{css}</style>
      <div className="inv-pad">
        {/* Header (match provided screenshot) */}
        <div className="inv-header">
          <img src="/logo.png" alt="Logo" className="inv-logo" />
          <div className="inv-brandCenter">
            <div className="inv-brandName">{seller.name}</div>
            <div className="inv-brandSub">{seller.subtitle}</div>
            <div className="inv-brandDesc">{seller.activity}</div>
            <div className="inv-brandDesc2">{seller.phones}</div>
            <div className="inv-brandAddr">{seller.address}</div>
          </div>
          <div />
        </div>

        <div className="inv-lineOrange" />

        {/* Contact + Meta */}
        <div className="inv-contactRow">
          <div className="inv-contactWrap">
            <div className="inv-contactLabel">{t("contact.title")}</div>
            <div className="inv-contactBox">
              <div className="inv-contactGrid">
                <div className="inv-field">
                  <span className="inv-fieldK">{t("contact.name")}</span>
                  <span className="inv-fieldV">{safeText(buyer?.isCompany ? buyer.companyName ?? buyer.fullName : buyer?.fullName ?? order.customerName)}</span>
                </div>
                <div className="inv-field">
                  <span className="inv-fieldK">{t("contact.serviceCharge")}</span>
                  <span className="inv-fieldV">{seller.serviceCharge}</span>
                </div>
                <div className="inv-field">
                  <span className="inv-fieldK">{t("contact.email")}</span>
                  <span className="inv-fieldV">{safeText(buyer?.email ?? order.customerEmail)}</span>
                </div>
                <div className="inv-field">
                  <span className="inv-fieldK">{t("contact.phone")}</span>
                  <span className="inv-fieldV">{safeText(buyer?.phone ?? order.customerPhone ?? null)}</span>
                </div>
                <div className="inv-field" style={{ gridColumn: "1 / span 2" }}>
                  <span className="inv-fieldK">{t("contact.address")}</span>
                  <span className="inv-fieldV">
                    {[
                      buyer?.addressLine1 ?? order.shippingAddress?.line1,
                      buyer?.addressLine2 ?? order.shippingAddress?.line2,
                      buyer?.city ?? order.shippingAddress?.city,
                      buyer?.postalCode ?? order.shippingAddress?.postalCode,
                    ]
                      .filter(Boolean)
                      .join(" • ") || placeholder}
                  </span>
                </div>
                {buyer?.isCompany ? (
                  <div className="inv-field" style={{ gridColumn: "1 / span 2" }}>
                    <span className="inv-fieldK">{t("contact.ice")}</span>
                    <span className="inv-fieldV">{safeText(buyer.ice)}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="inv-metaSimple">
            <div><span className="k">{t("meta.invoice")}</span> <span className="v">{t("meta.invoiceNumber", { orderNumber: order.orderNumber })}</span></div>
            <div><span className="k">{t("meta.date")}</span> <span className="v">{invoiceDate}</span></div>
          </div>
        </div>

        {/* Items table (updated style/columns) */}
        <div className="inv-tableWrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th className="inv-th" style={{ width: 70 }}>
                  {t("table.code")}
                </th>
                <th className="inv-th">{t("table.article")}</th>
                <th className="inv-th" style={{ width: 80 }}>
                  {t("table.qty")}
                </th>
                <th className="inv-th" style={{ width: 120, textAlign: "right" }}>
                  {t("table.unitPrice", { currency: dh })}
                </th>
                <th className="inv-th" style={{ width: 130, textAlign: "right" }}>
                  {t("table.total", { currency: dh })}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const code = String(item.productId ?? item.id)
                const variantInfo = [item.variantName, item.unitName].filter(Boolean).join(" • ")
                const articleLine = variantInfo ? `${item.productName} (${variantInfo})` : item.productName
                return (
                  <tr key={item.id} className="inv-rowAlt">
                    <td className="inv-td inv-tdMuted">{code}</td>
                    <td className="inv-td">
                      <div className="inv-tdStrong">{articleLine}</div>
                      {(item.discountPercentage && item.discountPercentage > 0) || (item.discountAmount && item.discountAmount > 0) ? (
                        <div className="inv-tdMuted" style={{ marginTop: 3 }}>
                          {t("table.lineDiscount")} {lineDiscountLabel(item, currency)}
                        </div>
                      ) : null}
                    </td>
                    <td className="inv-td">{item.quantity}</td>
                    <td className="inv-td" style={{ textAlign: "right" }}>{formatAmount(item.unitPrice)}</td>
                    <td className="inv-td inv-tdStrong" style={{ textAlign: "right" }}>{formatAmount(item.subtotal)}</td>
                  </tr>
                )
              })}

              {items.length === 0 ? (
                <tr>
                  <td className="inv-td" style={{ textAlign: "center" }} colSpan={5}>
                    {t("table.empty")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Total général (like backoffice) */}
        <div className="inv-totalsRow">
          <div className="inv-totalGeneral">
            <span className="inv-totalGeneralLabel">{t("totals.grandTotal")}</span>
            <span className="inv-totalGeneralValue">{formatAmount(order.totalAmount)} {dh}</span>
          </div>
        </div>

        {/* Details block (more ecommerce details) */}
        <div className="inv-details">
          <div className="inv-detailsTitle">{t("details.title")}</div>
          <div className="inv-detailsGrid">
            <div><span className="k">{t("details.subtotal")}</span> <span className="v">{formatMoney(order.subtotal, currency)}</span></div>
            <div><span className="k">{t("details.shipping")}</span> <span className="v">{formatMoney(order.shippingCost, currency)}</span></div>
            <div><span className="k">{t("details.tax")}</span> <span className="v">{formatMoney(order.taxAmount, currency)}</span></div>
            <div><span className="k">{t("details.promoDiscount")}</span> <span className="v">{order.discountAmount > 0 ? `- ${formatMoney(order.discountAmount, currency)}` : placeholder}</span></div>
            <div><span className="k">{t("details.remiseUsed")}</span> <span className="v">{remiseUsed > 0 ? `- ${formatMoney(remiseUsed, currency)}` : placeholder}</span></div>
            <div><span className="k">{t("details.amountToPay")}</span> <span className="v">{formatMoney(amountToPay, currency)}</span></div>
            <div><span className="k">{t("details.payment")}</span> <span className="v">{paymentMethodLabel} • {paymentStatusLabel}</span></div>
            <div><span className="k">{t("details.delivery")}</span> <span className="v">{deliveryLabel}</span></div>
          </div>
        </div>

      </div>

      {/* Footer pinned to bottom */}
      <div className="inv-footer">
        <div className="inv-footerLine">{seller.address}</div>
        <div className="inv-footerLine2">{seller.phones} | {t("footer.emailLabel")} {seller.email}</div>
        <div className="inv-footerLine3">{t("footer.serviceChargeLabel")} {seller.serviceCharge}</div>
      </div>
    </div>
  )
}
