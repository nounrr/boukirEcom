"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowUpRight, Check, Facebook, Globe, Instagram, MapPin, MessageCircle, Phone, Share2 } from "lucide-react"
import { Link } from "@/i18n/routing"
import type { AppLocale } from "@/i18n/locale"
import { COMPANY, type LinkKind, type SocialLink, type TeamMember } from "@/lib/links/team"
import styles from "./linktree.module.css"

type Copy = {
  pageLabel: string
  eyebrow: string
  available: string
  call: string
  whatsapp: string
  share: string
  copied: string
  footer: string
  linkLabels: Record<LinkKind, string>
}

const COPY: Record<AppLocale, Copy> = {
  fr: { pageLabel: "Contact professionnel", eyebrow: "Droguerie · Matériaux · Outillage", available: "Horaires d’ouverture", call: "Appeler", whatsapp: "WhatsApp", share: "Partager", copied: "Lien copié", footer: "Matériaux et outillage · Tanger", linkLabels: { maps: "Google Maps", website: "Site web", facebook: "Facebook", instagram: "Instagram" } },
  en: { pageLabel: "Business contact", eyebrow: "Hardware · Materials · Tools", available: "Opening hours", call: "Call", whatsapp: "WhatsApp", share: "Share", copied: "Link copied", footer: "Materials and tools · Tangier", linkLabels: { maps: "Google Maps", website: "Website", facebook: "Facebook", instagram: "Instagram" } },
  ar: { pageLabel: "اتصال مهني", eyebrow: "أدوات · مواد البناء · معدات", available: "ساعات العمل", call: "اتصال", whatsapp: "واتساب", share: "مشاركة", copied: "تم نسخ الرابط", footer: "مواد البناء والمعدات · طنجة", linkLabels: { maps: "خرائط Google", website: "الموقع الإلكتروني", facebook: "فيسبوك", instagram: "إنستغرام" } },
  zh: { pageLabel: "商务联系", eyebrow: "五金 · 建材 · 工具", available: "营业时间", call: "致电", whatsapp: "WhatsApp", share: "分享", copied: "链接已复制", footer: "建材与工具 · 丹吉尔", linkLabels: { maps: "Google 地图", website: "官方网站", facebook: "Facebook", instagram: "Instagram" } },
}

type SupportingCopy = { hoursDays: string; hoursTime: string; linkHints: Record<LinkKind, string>; roles: Record<string, string> }
const SUPPORTING_COPY: Record<AppLocale, SupportingCopy> = {
  fr: { hoursDays: "Lun – Sam", hoursTime: "08h00 – 19h00", linkHints: { maps: "Laissez-nous un avis", website: "Catalogue en ligne", facebook: "Actualités et offres", instagram: "Chantiers et nouveautés" }, roles: {} },
  en: { hoursDays: "Mon – Sat", hoursTime: "8:00 am – 7:00 pm", linkHints: { maps: "Leave us a review", website: "Online catalogue", facebook: "News and offers", instagram: "Projects and arrivals" }, roles: { p1: "Director", p2: "Manager", p3: "Sales Advisor" } },
  ar: { hoursDays: "الإثنين – السبت", hoursTime: "08:00 – 19:00", linkHints: { maps: "اترك لنا تقييماً", website: "الكتالوج الإلكتروني", facebook: "الأخبار والعروض", instagram: "المشاريع والمنتجات" }, roles: { p1: "المدير", p2: "المسير", p3: "مستشار تجاري" } },
  zh: { hoursDays: "周一至周六", hoursTime: "08:00–19:00", linkHints: { maps: "给我们留下评价", website: "在线目录", facebook: "新闻与优惠", instagram: "项目与新品" }, roles: { p1: "总监", p2: "经理", p3: "销售顾问" } },
}

const ICONS: Record<LinkKind, React.ComponentType<{ className?: string }>> = { maps: MapPin, website: Globe, facebook: Facebook, instagram: Instagram }

function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value)
  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  textarea.remove()
  return Promise.resolve()
}

export function LinktreePage({ member, links, locale }: { member: TeamMember; team: TeamMember[]; links: SocialLink[]; locale: AppLocale }) {
  const copy = COPY[locale] ?? COPY.fr
  const supporting = SUPPORTING_COPY[locale] ?? SUPPORTING_COPY.fr
  const isRtl = locale === "ar"
  const [copied, setCopied] = useState(false)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
  }, [])

  const share = useCallback(async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: `${member.firstName} ${member.lastName} · ${COMPANY.name}`, url })
        return
      }
      await copyToClipboard(url)
      setCopied(true)
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
      feedbackTimer.current = setTimeout(() => setCopied(false), 1800)
    } catch { /* Closing the share sheet is an expected outcome. */ }
  }, [member])

  const memberRole = supporting.roles[member.slug] ?? (isRtl && member.roleAr ? member.roleAr : member.role)

  return (
    <div className={styles.page} dir={isRtl ? "rtl" : "ltr"}>
      <div className={styles.dashboard}>
        <header className={styles.topbar}>
          <Link href={`/${member.slug}`} className={styles.brand} aria-label={`${COMPANY.name} — ${copy.pageLabel}`}>
            <span className={styles.monogram} aria-hidden="true">B</span>
            <span><strong>{COMPANY.name}</strong><small>{copy.pageLabel}</small></span>
          </Link>
          <button type="button" onClick={share} className={styles.shareButton} aria-label={copy.share}>
            {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
            <span>{copied ? copy.copied : copy.share}</span>
          </button>
          <span className={styles.srOnly} aria-live="polite">{copied ? copy.copied : ""}</span>
        </header>

        <main className={styles.main}>
          <section className={styles.identity} aria-labelledby="contact-name">
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <div className={styles.identityHeading}>
              <span className={styles.memberMark} aria-hidden="true">{member.initials}</span>
              <div>
                <p className={styles.companyName}>{COMPANY.name}</p>
                <h1 id="contact-name">{`${member.firstName} ${member.lastName}`}</h1>
                <p className={styles.role}>{memberRole}</p>
              </div>
            </div>
            <div className={styles.availability}>
              <span aria-hidden="true" />
              <p><strong>{copy.available}</strong><small><span>{supporting.hoursDays}</span><span aria-hidden="true"> · </span><bdi dir="ltr">{supporting.hoursTime}</bdi></small></p>
            </div>
          </section>

          <nav className={styles.linkGrid} aria-label={copy.pageLabel}>
            {links.map((link) => {
              const Icon = ICONS[link.kind]
              return (
                <a key={link.kind} href={link.href} target="_blank" rel="noopener noreferrer">
                  <span className={styles.destinationIcon}><Icon aria-hidden="true" /></span>
                  <span className={styles.destinationText}><strong>{copy.linkLabels[link.kind]}</strong><small>{supporting.linkHints[link.kind]}</small></span>
                  <ArrowUpRight aria-hidden="true" />
                </a>
              )
            })}
          </nav>

          <div className={styles.contactActions}>
            <a href={`tel:${member.phone.replace(/[\s-]+/g, "")}`} className={styles.callAction}>
              <Phone aria-hidden="true" /><strong>{copy.call}</strong><bdi dir="ltr">{member.phone}</bdi>
            </a>
            <a href={`https://wa.me/${member.whatsapp}`} target="_blank" rel="noopener noreferrer" className={styles.whatsappAction}>
              <MessageCircle aria-hidden="true" /><strong>{copy.whatsapp}</strong><ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </main>

        <footer className={styles.footer}>© {new Date().getFullYear()} {COMPANY.name}<span>{copy.footer}</span></footer>
      </div>
    </div>
  )
}
