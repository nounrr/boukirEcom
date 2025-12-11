"use client"
import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginForm } from "@/components/auth/login-form"

export function LoginPageClient() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
