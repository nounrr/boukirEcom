import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale?: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    title: 'Boukir E-Commerce',
    description: t('home'),
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
    params: Promise<{ locale?: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || routing.defaultLocale;

  // Ensure that the incoming locale is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  return children;
}
