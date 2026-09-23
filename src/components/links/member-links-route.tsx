import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LinktreePage } from "@/components/links/linktree-page"
import { normalizeLocale } from "@/i18n/locale"
import { COMPANY, COMPANY_LINKS, TEAM, findMember } from "@/lib/links/team"
import { buildPageMetadata } from "@/lib/seo/metadata"

type Params = Promise<{ locale?: string }>

/** Construit une route courte (/fr/p1, /fr/p2…) vers la page linktree d'un membre. */
export function memberLinksRoute(slug: string) {
  async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { locale: localeParam } = await params
    const member = findMember(slug)
    if (!member) return {}
    return buildPageMetadata({
      locale: normalizeLocale(localeParam),
      path: `/${member.slug}`,
      title: `${member.firstName} ${member.lastName} · ${member.role}`,
      description: `${COMPANY.name} ${COMPANY.tagline} — ${COMPANY.city}. Google Maps, site web, Facebook, Instagram.`,
      openGraphType: "profile",
      twitterCard: "summary",
    })
  }

  async function Page({ params }: { params: Params }) {
    const { locale: localeParam } = await params
    const member = findMember(slug)
    if (!member) notFound()
    return <LinktreePage member={member} team={TEAM} links={COMPANY_LINKS} locale={normalizeLocale(localeParam)} />
  }

  return { generateMetadata, Page }
}
