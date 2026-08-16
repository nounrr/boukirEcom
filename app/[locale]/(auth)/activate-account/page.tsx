"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { CheckCircle2, KeyRound } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useActivateAccountMutation } from "@/state/api/auth-api-slice"

export default function ActivateAccountPage() {
  const locale = useLocale()
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [message, setMessage] = useState("")
  const [completed, setCompleted] = useState(false)
  const [activateAccount, { isLoading }] = useActivateAccountMutation()

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    setToken(params.get("token") || "")
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage("")
    if (!token) {
      setMessage("Ce lien d’activation est invalide.")
      return
    }
    if (password.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (password !== confirmation) {
      setMessage("Les mots de passe ne correspondent pas.")
      return
    }
    try {
      const result = await activateAccount({
        token,
        password,
        confirm_password: confirmation,
      }).unwrap()
      setMessage(result.message)
      setCompleted(true)
    } catch (error: any) {
      setMessage(error?.data?.message || "Impossible d’activer ce compte.")
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
            {completed ? <CheckCircle2 className="size-7 text-green-600" /> : <KeyRound className="size-7 text-primary" />}
          </div>
          <h1 className="mt-4 text-2xl font-bold">Activer mon compte Artisan/Maalem</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choisissez votre mot de passe. Il ne sera jamais communiqué à l’équipe Boukir.
          </p>
        </div>

        {completed ? (
          <div className="space-y-4 text-center">
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>
            <Button asChild className="w-full">
              <Link href={`/${locale}/login`}>Se connecter</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input id="password" type="password" autoComplete="new-password" minLength={8} maxLength={100} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
              <Input id="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={100} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1" />
            </div>
            {message && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}
            <Button type="submit" disabled={isLoading || !token} className="w-full">
              {isLoading ? "Activation…" : "Activer mon compte"}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
