import { routing } from '@/i18n/routing';
import StoreProvider from '@/state/StoreProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter, Tajawal } from 'next/font/google';
import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';
import { getAuthCookies } from '@/lib/cookies';
import { UserSessionInitializer } from '@/components/auth/user-session-initializer';
import { CurrentUserInitializer } from '@/components/auth/current-user-initializer';
import { GoogleOneTapWrapper } from '@/components/auth/google-one-tap-wrapper';
import '../arabic-fonts.css';
import '../globals.css';

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  preload: true,
  adjustFontFallback: true,
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: 'swap',
  fallback: ['Tahoma', 'Arial', 'sans-serif'],
  preload: true,
  adjustFontFallback: true,
});

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

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });

  // Get auth session from cookies for Redux initialization
  const session = await getAuthCookies();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className={`${inter.variable} ${tajawal.variable} ${inter.className} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <StoreProvider>
            <UserSessionInitializer session={session} />
            <CurrentUserInitializer />
            <GoogleOneTapWrapper />
            {children}
          </StoreProvider>
        </NextIntlClientProvider>
        <Toaster
          position="top-center"
          theme="system"
          richColors={false}
          closeButton={false}
          expand={true}
          duration={4000}
          gap={12}
          visibleToasts={5}
          toastOptions={{
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
              padding: '16px 20px',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
            },
            className: 'toast-custom',
            unstyled: false,
          }}
        />
      </body>
    </html>
  );
}
