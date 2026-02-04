import type { Metadata } from "next"
import RegisterPageClient from "./client"

export const metadata: Metadata = {
  title: "Créer un compte | Boukir Diamond",
  description: "Créez un compte Boukir Diamond pour commander plus rapidement et suivre vos achats.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/register",
    languages: {
      fr: "/register",
      ar: "/ar/register",
      en: "/en/register",
      zh: "/zh/register",
    },
  },
  openGraph: {
    title: "Créer un compte | Boukir Diamond",
    description: "Créez un compte Boukir Diamond.",
    type: "website",
  },
}

export default function RegisterPage() {
  return <RegisterPageClient />
}
