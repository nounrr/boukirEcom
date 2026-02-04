import type { Metadata } from "next"
import { LoginPageClient } from "./login-client"

export const metadata: Metadata = {
  title: "Connexion | Boukir Diamond",
  description: "Connectez-vous à votre compte Boukir Diamond pour accéder à votre profil et à vos commandes.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/login",
    languages: {
      fr: "/login",
      ar: "/ar/login",
      en: "/en/login",
      zh: "/zh/login",
    },
  },
  openGraph: {
    title: "Connexion | Boukir Diamond",
    description: "Connectez-vous à votre compte Boukir Diamond.",
    type: "website",
  },
}

export default function LoginPage() {
  return <LoginPageClient />
}
