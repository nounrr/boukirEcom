"use client"
import { AuthLayout } from "@/components/auth/auth-layout"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPageClient() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  )
}
