import type { Metadata } from "next"
import RegisterPageClient from "./client"

export const metadata: Metadata = {
  title: "Créer un compte - Notre Plateforme",
  description: "Inscrivez-vous et rejoignez notre communauté de confiance",
  openGraph: {
    title: "Créer un compte - Notre Plateforme",
    description: "Inscrivez-vous et rejoignez notre communauté de confiance",
    type: "website",
  },
}

export default function RegisterPage() {
  return <RegisterPageClient />
}
