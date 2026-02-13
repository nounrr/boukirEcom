import StoreProvider from "@/state/StoreProvider"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { Inter, Tajawal } from "next/font/google"
import type { Metadata } from "next"
import { Toaster } from "sonner"

import { getAuthCookies } from "@/lib/cookies"
import { UserSessionInitializer } from "@/components/auth/user-session-initializer"
import { CurrentUserInitializer } from "@/components/auth/current-user-initializer"
import { AuthDebugPanel } from "@/components/auth/auth-debug-panel"
import { GoogleOneTapWrapper } from "@/components/auth/google-one-tap-wrapper"
import { ArtisanRequestPromptWrapper } from "@/components/auth/artisan-request-prompt-wrapper"
import { CartContextProvider } from "@/components/layout/cart-context-provider"
import { AuthDialogProvider } from "@/components/providers/auth-dialog-provider"
import { LocalePreferenceInitializer } from "@/components/i18n/locale-preference-initializer"

import "./arabic-fonts.css"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  preload: true,
  adjustFontFallback: true,
})

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
  preload: true,
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  const session = await getAuthCookies()

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={`${inter.variable} ${tajawal.variable} ${inter.className} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <StoreProvider>
            <LocalePreferenceInitializer />
            <UserSessionInitializer session={session} />
            <CurrentUserInitializer />
            <AuthDebugPanel />
            <GoogleOneTapWrapper />
            <ArtisanRequestPromptWrapper />
            <CartContextProvider>
              <AuthDialogProvider>
                <div className="min-h-screen flex flex-col">
                  <div className="flex-1">{children}</div>
                </div>
              </AuthDialogProvider>
            </CartContextProvider>
          </StoreProvider>
        </NextIntlClientProvider>

        <Toaster
          position={locale === "ar" ? "top-right" : "top-left"}
          dir={locale === "ar" ? "rtl" : "ltr"}
          theme="system"
          richColors={false}
          closeButton={false}
          expand={true}
          duration={4000}
          gap={12}
          visibleToasts={5}
          toastOptions={{
            style: {
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
              padding: "16px 20px",
              boxShadow:
                "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
            },
            className: "toast-custom",
            unstyled: false,
          }}
        />
      </body>
    </html>
  )
}
