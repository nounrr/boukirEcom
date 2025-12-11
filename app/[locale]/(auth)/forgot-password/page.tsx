import type { Metadata } from "next"
import ForgotPasswordPageClient from "./client"

export const metadata: Metadata = {
  title: "Réinitialiser votre mot de passe - Notre Plateforme",
  description: "Vous avez oublié votre mot de passe ? Nous vous aiderons à le récupérer en quelques étapes simples",
  openGraph: {
    title: "Réinitialiser votre mot de passe - Notre Plateforme",
    description: "Récupérez l'accès à votre compte en réinitialisant votre mot de passe",
    type: "website",
  },
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />
}
