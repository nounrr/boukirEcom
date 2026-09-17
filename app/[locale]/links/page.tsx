import type { Metadata } from "next"

import { LinktreePage } from "@/components/links/linktree-page"
import { normalizeLocale } from "@/i18n/locale"
import { COMPANY, COMPANY_LINKS, DEFAULT_MEMBER, TEAM } from "@/lib/links/team"
import { buildPageMetadata } from "@/lib/seo/metadata"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>
}): Promise<Metadata> {
  const { locale: localeParam } = await params
  const locale = normalizeLocale(localeParam)
  return buildPageMetadata({
    locale,
    path: "/links",
    title: `${DEFAULT_MEMBER.firstName} ${DEFAULT_MEMBER.lastName} · ${DEFAULT_MEMBER.role}`,
    description: `${COMPANY.name} ${COMPANY.tagline} — ${COMPANY.city}. Google Maps, site web, Facebook, Instagram.`,
    openGraphType: "profile",
    twitterCard: "summary",
  })
}

export default async function LinksPage({
  params,
}: {
  params: Promise<{ locale?: string }>
}) {
  const { locale: localeParam } = await params
  const locale = normalizeLocale(localeParam)

  return (
    <LinktreePage
      member={DEFAULT_MEMBER}
      team={TEAM}
      links={COMPANY_LINKS}
      locale={locale}
    />
  )
}
