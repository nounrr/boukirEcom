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
import { WhatsAppFloatingButton } from "@/components/layout/whatsapp-floating-button"
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

  const isRtl = locale === "ar"

  const session = await getAuthCookies()

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={`${inter.variable} ${tajawal.variable} ${inter.className} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <StoreProvider>
            <LocalePreferenceInitializer />
            <UserSessionInitializer session={session} />
            <CurrentUserInitializer />
            <AuthDebugPanel />
            <GoogleOneTapWrapper />
            <WhatsAppFloatingButton />
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
          position={isRtl ? "top-left" : "top-right"}
          dir={isRtl ? "rtl" : "ltr"}
          theme="system"
          richColors={false}
          closeButton={false}
          expand={true}
          duration={4000}
          gap={12}
          visibleToasts={5}
        />
      </body>
    </html>
  )
}
