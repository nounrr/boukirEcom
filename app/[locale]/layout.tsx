import { routing } from "@/i18n/routing"
import { buildPageMetadata } from "@/lib/seo/metadata"
import { normalizeLocale } from '@/i18n/locale'
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const locale = normalizeLocale(resolvedParams?.locale)

  // Defaults only (site name, description, sharing image). Every real page sets its own title,
  // canonical, hreflang and robots; leaving them out here keeps error pages (404 inside a route)
  // from inheriting the home page's canonical and « index, follow » next to Next.js's « noindex ».
  const defaults = buildPageMetadata({ locale, path: "/" })
  const { alternates: _alternates, robots: _robots, ...rest } = defaults
  return {
    ...rest,
    openGraph: defaults.openGraph ? { ...defaults.openGraph, url: undefined } : undefined,
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
    params: Promise<{ locale?: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || routing.defaultLocale;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  return children
}
