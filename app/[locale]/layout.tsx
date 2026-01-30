import { routing } from "@/i18n/routing"
import { notFound } from "next/navigation"

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
