import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LinktreePage } from "@/components/links/linktree-page"
import { normalizeLocale } from "@/i18n/locale"
import { routing } from "@/i18n/routing"
import { COMPANY, COMPANY_LINKS, TEAM, findMember } from "@/lib/links/team"
import { buildPageMetadata } from "@/lib/seo/metadata"

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    TEAM.map((member) => ({ locale, slug: member.slug })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string; slug?: string }>
}): Promise<Metadata> {
  const { locale: localeParam, slug } = await params
  const locale = normalizeLocale(localeParam)
  const member = findMember(slug)
  if (!member) return {}

  return buildPageMetadata({
    locale,
    path: `/links/${member.slug}`,
    title: `${member.firstName} ${member.lastName} · ${member.role}`,
    description: `${COMPANY.name} ${COMPANY.tagline} — ${COMPANY.city}. Google Maps, site web, Facebook, Instagram.`,
    openGraphType: "profile",
    twitterCard: "summary",
  })
}

export default async function MemberLinksPage({
  params,
}: {
  params: Promise<{ locale?: string; slug?: string }>
}) {
  const { locale: localeParam, slug } = await params
  const locale = normalizeLocale(localeParam)
  const member = findMember(slug)
  if (!member) notFound()

  return (
    <LinktreePage
      member={member}
      team={TEAM}
      links={COMPANY_LINKS}
      locale={locale}
    />
  )
}
