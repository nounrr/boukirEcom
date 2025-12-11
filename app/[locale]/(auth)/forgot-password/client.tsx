"use client"

import { AuthLayout } from "@/components/auth/auth-layout"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPageClient() {
  const handleForgotPassword = async (email: string) => {
    console.log("Forgot password:", email)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Réinitialiser votre mot de passe</h1>
          <p className="text-sm text-muted-foreground">Pas de souci, nous vous aiderons à le récupérer</p>
        </div>

        <ForgotPasswordForm onSubmit={handleForgotPassword} />
      </div>
    </AuthLayout>
  )
}
