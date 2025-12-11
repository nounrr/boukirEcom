import type React from "react"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Notre Plateforme - Authentification",
  description: "Connectez-vous ou créez un compte sur notre plateforme de confiance",
  generator: "Next.js",
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
    title: "Notre Plateforme",
    description: "Votre plateforme de confiance pour tous vos besoins en ligne",
    type: "website",
    locale: "fr_FR",
  },
  alternates: {
    languages: {
      "fr-FR": "/fr",
      "en-US": "/en",
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
