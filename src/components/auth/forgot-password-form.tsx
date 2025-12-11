"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const validateForm = () => {
    if (!email.includes("@")) {
      setError("Email invalide")
      return false
    }
    setError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      setIsLoading(true)
      await onSubmit(email)
      setSubmitted(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-2">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email envoyé !</h2>
          <p className="text-muted-foreground mt-2">
            Nous avons envoyé un lien de réinitialisation à <br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Consultez votre boîte de réception (et le dossier Spam) pour vérifier votre email.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <Button onClick={() => setSubmitted(false)} variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Envoyer à une autre adresse
          </Button>
          <Link href="/auth/login" className="block">
            <Button className="w-full bg-primary hover:bg-primary/90">Retour à la connexion</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Adresse email <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            placeholder="exemple@email.com"
            className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background transition-all"
          />
        </div>
        {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Entrez l'adresse email associée à votre compte. Nous vous enverrons un lien sécurisé pour réinitialiser votre
        mot de passe.
      </p>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Envoi en cours...</span>
          </div>
        ) : (
          "Envoyer le lien"
        )}
      </Button>

      <Link
        href="/auth/login"
        className="block text-center text-sm text-primary hover:text-primary/80 font-medium transition-colors"
      >
        Retour à la connexion
      </Link>
    </form>
  )
}
