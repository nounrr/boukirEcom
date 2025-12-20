"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { useForm, FieldValues, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations, useLocale } from "next-intl"
import { login } from "@/actions/auth/login"
import { toast } from "@/hooks/use-toast"
import { createLoginSchema } from "@/lib/validations"
import { useGoogleAuth } from "@/hooks/use-google-auth"
import { useAppDispatch } from "@/state/hooks"
import { setAuth } from "@/state/slices/user-slice"

interface LoginFormProps {
  onSubmit?: (data: { email: string; password: string }) => Promise<void>
  onSuccess?: () => void
  skipRedirect?: boolean
}

export function LoginForm({ onSubmit: customOnSubmit, onSuccess, skipRedirect = false }: LoginFormProps) {
  const t = useTranslations('auth')
  const tv = useTranslations('validation')
  const tp = useTranslations('placeholders')
  const tt = useTranslations('toast.auth')
  const locale = useLocale()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const isArabic = locale === 'ar'
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [loginStatus, setLoginStatus] = useState<Awaited<ReturnType<typeof login>>>()
  // Initialize Google OAuth with custom button
  const { isLoading: isGoogleLoading, signIn: handleGoogleSignIn } = useGoogleAuth({
    context: "signin",
    redirectTo: `/${locale}`,
    skipRedirect,
    onSuccess: skipRedirect ? onSuccess : undefined,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createLoginSchema(tv)),
    mode: "all"
  })

  useEffect(() => {
    console.log('[LOGIN FORM] loginStatus changed:', loginStatus)
    if (loginStatus && !loginStatus?.success && loginStatus?.error) {
      console.log('[LOGIN FORM] Showing error toast:', loginStatus.error)
      toast.error(loginStatus?.error)
    } else if (loginStatus && loginStatus?.success) {
      console.log('[LOGIN FORM] Showing success toast')
      const name = loginStatus.user?.prenom || loginStatus.user?.nom || loginStatus.user?.email || 'Utilisateur'
      toast.success(tt('loginSuccess'), { description: tt('loginSuccessDesc', { name }) })
      console.log('[LOGIN FORM] Login successful, accessToken:', loginStatus.accessToken)
      
      // Dispatch to Redux store
      if (loginStatus.user && loginStatus.accessToken) {
        dispatch(setAuth({
          user: loginStatus.user,
          accessToken: loginStatus.accessToken,
          refreshToken: loginStatus.refreshToken || null
        }))
        console.log('[LOGIN FORM] User data dispatched to Redux store')
      }
      
      if (!skipRedirect) {
        setTimeout(() => {
          console.log('[LOGIN FORM] Redirecting to:', `/${locale}`)
          router.push(`/${locale}`)
        }, 200)
      } else {
        onSuccess?.()
      }
    }
  }, [loginStatus, router, locale, tt, dispatch])

  const onSubmit: SubmitHandler<FieldValues> = useCallback((data) => {
    console.log('[LOGIN FORM] Submit handler called with:', data)
    startTransition(async () => {
      console.log('[LOGIN FORM] Starting transition')
      if (customOnSubmit) {
        console.log('[LOGIN FORM] Using custom onSubmit')
        await customOnSubmit(data as { email: string; password: string })
        return
      }
      
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => formData.append(key, value as string))
      console.log('[LOGIN FORM] Calling login action')
      const result = await login(formData)
      console.log('[LOGIN FORM] Login result:', result)
      setLoginStatus(result)
    })
  }, [customOnSubmit])

  return (
    <div className="space-y-8 w-full" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="text-center space-y-1.5">
        <h1 className={`text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent ${isArabic ? 'font-arabic' : ''}`}>
          {t('loginTitle')}
        </h1>
        <p className={`text-base text-muted-foreground/80 ${isArabic ? 'font-arabic' : ''}`}>
          {t('loginSubtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className={isArabic ? 'font-arabic' : ''}>
            {t('email')} <span className="text-destructive">{t('required')}</span>
          </Label>
          <Input
            id="email"
            type="email"
            disabled={isPending}
            placeholder={tp('email')}
            Icon={Mail}
            error={errors.email?.message as string}
            sm={true}
            {...register('email')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className={isArabic ? 'font-arabic' : ''}>
            {t('password')} <span className="text-destructive">{t('required')}</span>
          </Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            disabled={isPending}
            placeholder="••••••••"
            Icon={Lock}
            error={errors.password?.message as string}
            sm={true}
            {...register('password')}
          >
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setShowPassword(!showPassword)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground border-0 hover:bg-transparent"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </Input>
        </div>

        <div className={isArabic ? 'text-left -mt-2' : 'text-right -mt-2'}>
          <Link
            href={`/${locale}/forgot-password`}
            className={`text-sm text-primary hover:text-primary/80 font-medium transition-colors ${isArabic ? 'font-arabic' : ''}`}
          >
            {t('forgotPassword')}
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className={`w-full h-11 font-semibold bg-primary hover:bg-primary/90 rounded-lg transition-colors text-white ${isArabic ? 'font-arabic' : ''}`}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('loggingIn')}</span>
            </div>
          ) : (
            t('signIn')
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center">
          <span className={`bg-background px-3 text-xs text-muted-foreground font-medium ${isArabic ? 'font-arabic' : ''}`}>{t('orWith')}</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Google Sign-In Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="h-10 border border-input hover:bg-neutral-50 text-sm font-medium bg-transparent"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                <span className="ltr:ml-2 rtl:mr-2">Google</span>
            </>
          )}
        </Button>
        
        {/* Facebook Button (Coming Soon) */}
        <Button
          type="button"
          variant="outline"
          disabled
          className="h-10 border border-input hover:bg-neutral-50 text-sm font-medium bg-transparent opacity-60 cursor-not-allowed"
        >
          <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="ltr:ml-2 rtl:mr-2">Facebook</span>
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center pt-2 border-t border-border">
        <p className={`text-sm text-muted-foreground ${isArabic ? 'font-arabic' : ''}`}>
          {t('dontHaveAccount')}{" "}
          <Link href={`/${locale}/register`} className="font-semibold text-primary hover:text-primary/80 transition-colors">
            {t('createAccount')}
          </Link>
        </p>
      </div>
    </div>
  )
}
