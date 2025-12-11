import type { Metadata } from "next"
import { LoginPageClient } from "./login-client"

export const metadata: Metadata = {
  title: "Connexion - Notre Plateforme",
  description: "Connectez-vous à votre compte pour accéder à votre tableau de bord",
  openGraph: {
    title: "Connexion - Notre Plateforme",
    description: "Connectez-vous à votre compte pour accéder à votre tableau de bord",
    type: "website",
  },
}

export default function LoginPage() {
  return <LoginPageClient />
}
