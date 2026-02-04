import { routing } from "@/i18n/routing"
import { buildPageMetadata } from "@/lib/seo/metadata"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const locale = resolvedParams?.locale || routing.defaultLocale

  return buildPageMetadata({
    locale,
    path: "/",
  })
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
