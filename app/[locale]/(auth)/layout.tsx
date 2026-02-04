import type React from "react"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Boukir Diamond - Authentification",
  description: "Connectez-vous ou créez un compte Boukir Diamond.",
  generator: "Next.js",
  robots: {
    index: false,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Boukir Diamond",
    description: "Connectez-vous à Boukir Diamond.",
    type: "website",
    locale: "fr_MA",
  },
  alternates: {
    languages: {
      fr: "/",
      ar: "/ar",
      en: "/en",
      zh: "/zh",
    },
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E8A626" },
    { media: "(prefers-color-scheme: dark)", color: "#D99323" },
  ],
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
