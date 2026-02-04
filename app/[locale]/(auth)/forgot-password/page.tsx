import type { Metadata } from "next"
import ForgotPasswordPageClient from "./client"

export const metadata: Metadata = {
  title: "Mot de passe oublié | Boukir Diamond",
  description: "Réinitialisez votre mot de passe Boukir Diamond et récupérez l’accès à votre compte.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/forgot-password",
    languages: {
      fr: "/forgot-password",
      ar: "/ar/forgot-password",
      en: "/en/forgot-password",
      zh: "/zh/forgot-password",
    },
  },
  openGraph: {
    title: "Mot de passe oublié | Boukir Diamond",
    description: "Réinitialisez votre mot de passe Boukir Diamond.",
    type: "website",
  },
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />
}
