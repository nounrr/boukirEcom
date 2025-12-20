"use client"

import { register as registerAction } from "@/actions/auth/register"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toggle } from "@/components/ui/toggle"
import { useGoogleAuth } from "@/hooks/use-google-auth"
import { toast } from "@/hooks/use-toast"
import { createRegisterSchema } from "@/lib/validations"
import { useAppDispatch } from "@/state/hooks"
import { setAuth } from "@/state/slices/user-slice"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, Lock, Mail, Phone, User } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"
import { FieldValues, SubmitHandler, useForm } from "react-hook-form"

interface RegisterFormProps {
  onSubmit?: (data: any) => Promise<void>
  onSuccess?: () => void
  skipRedirect?: boolean
}

export function RegisterForm({ onSubmit: customOnSubmit, onSuccess, skipRedirect = false }: RegisterFormProps) {
  const t = useTranslations('auth')
  const tv = useTranslations('validation')
  const tp = useTranslations('placeholders')
  const tt = useTranslations('toast.auth')
  const locale = useLocale()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const isArabic = locale === 'ar'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [registerStatus, setRegisterStatus] = useState<Awaited<ReturnType<typeof registerAction>>>()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createRegisterSchema(tv)),
    mode: "all",
    defaultValues: {
      role: "client" as "client" | "artisan-promoter"
    }
  })

  const role = watch('role')

  // Initialize Google OAuth with custom button
  const { isLoading: isGoogleLoading, signIn: handleGoogleSignIn } = useGoogleAuth({
    context: "signup",
    role: role,
    redirectTo: `/${locale}`,
    skipRedirect,
    onSuccess: skipRedirect ? onSuccess : undefined,
  })

  useEffect(() => {
    console.log('[REGISTER FORM] registerStatus changed:', registerStatus)
    if (registerStatus && !registerStatus?.success && registerStatus?.error) {
      console.log('[REGISTER FORM] Showing error toast:', registerStatus.error)
      toast.error(registerStatus?.error)
    } else if (registerStatus && registerStatus?.success) {
      console.log('[REGISTER FORM] Showing success toast')
      const name = registerStatus.user?.prenom || registerStatus.user?.nom || registerStatus.user?.email || 'Utilisateur'
      toast.success(tt('registerSuccess'), { description: tt('registerSuccessDesc', { name }) })
      console.log('[REGISTER FORM] Registration successful, accessToken:', registerStatus.accessToken)
      
      // Dispatch to Redux store
      if (registerStatus.user && registerStatus.accessToken) {
        dispatch(setAuth({
          user: registerStatus.user,
          accessToken: registerStatus.accessToken,
          refreshToken: registerStatus.refreshToken || null
        }))
        console.log('[REGISTER FORM] User data dispatched to Redux store')
      }
      
      if (!skipRedirect) {
        setTimeout(() => {
          console.log('[REGISTER FORM] Redirecting to:', `/${locale}`)
          router.push(`/${locale}`)
        }, 200)
      } else {
        onSuccess?.()
      }
    }
  }, [registerStatus, router, locale, tt, dispatch])

  const onSubmit: SubmitHandler<FieldValues> = useCallback((data) => {
    console.log('[REGISTER FORM] Submit handler called with:', data)
    startTransition(async () => {
      console.log('[REGISTER FORM] Starting transition')
      if (customOnSubmit) {
        console.log('[REGISTER FORM] Using custom onSubmit')
        await customOnSubmit(data)
        return
      }
      
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => formData.append(key, value as string))
      console.log('[REGISTER FORM] Calling register action')
      const result = await registerAction(formData)
      console.log('[REGISTER FORM] Register result:', result)
      setRegisterStatus(result)
    })
  }, [customOnSubmit])

  return (
    <div className="space-y-6 w-full" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="text-center space-y-1">
        <h1 className={`text-3xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent ${isArabic ? 'font-arabic' : ''}`}>
          {t('registerTitle')}
        </h1>
        <p className={`text-sm text-muted-foreground/80 ${isArabic ? 'font-arabic' : ''}`}>
          {t('registerSubtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName" className={isArabic ? 'font-arabic' : ''}>
              {t('firstName')} <span className="text-destructive">{t('required')}</span>
            </Label>
            <Input
              id="firstName"
              type="text"
              disabled={isPending}
              placeholder={tp('firstName')}
              Icon={User}
              error={errors.firstName?.message as string}
              sm={true}
              {...register('firstName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className={isArabic ? 'font-arabic' : ''}>
              {t('lastName')} <span className="text-destructive">{t('required')}</span>
            </Label>
            <Input
              id="lastName"
              type="text"
              disabled={isPending}
              placeholder={tp('lastName')}
              Icon={User}
              error={errors.lastName?.message as string}
              sm={true}
              {...register('lastName')}
            />
          </div>
        </div>

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
          <Label htmlFor="phone" className={isArabic ? 'font-arabic' : ''}>
            {t('phone')} <span className="text-destructive">{t('required')}</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            disabled={isPending}
            placeholder={tp('phone')}
            Icon={Phone}
            error={errors.phone?.message as string}
            sm={true}
            {...register('phone')}
          />
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <Label className={isArabic ? 'font-arabic' : ''}>
            {t('role')} <span className="text-destructive">{t('required')}</span>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Toggle
              pressed={role === 'client'}
              onPressedChange={() => setValue('role', 'client')}
              variant="outline"
              className={`flex items-center justify-start gap-2 px-3 py-2.5 h-auto ${
                role === 'client'
                  ? 'border-primary bg-primary/5 data-[state=on]:bg-primary/5 data-[state=on]:text-primary'
                  : ''
              }`}
            >
              <User className="w-5 h-5" />
              <span className={`text-sm font-medium ${isArabic ? 'font-arabic' : ''}`}>
                {t('client')}
              </span>
              {role === 'client' && (
                <svg className="w-4 h-4 ltr:ml-auto rtl:mr-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </Toggle>

            <Toggle
              pressed={role === 'artisan-promoter'}
              onPressedChange={() => setValue('role', 'artisan-promoter')}
              variant="outline"
              className={`flex items-center justify-start gap-2 px-3 py-2.5 h-auto ${
                role === 'artisan-promoter'
                  ? 'border-primary bg-primary/5 data-[state=on]:bg-primary/5 data-[state=on]:text-primary'
                  : ''
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className={`text-sm font-medium ${isArabic ? 'font-arabic' : ''}`}>
                {t('artisanPromoter')}
              </span>
              {role === 'artisan-promoter' && (
                <svg className="w-4 h-4 ltr:ml-auto rtl:mr-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </Toggle>
          </div>
          {errors.role && (
            <p className={`text-sm text-destructive mt-1 ${isArabic ? 'font-arabic' : ''}`}>{errors.role.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="password" className={isArabic ? 'font-arabic' : ''}>
              {t('password')} <span className="text-destructive">{t('required')}</span>
            </Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              disabled={isPending}
              placeholder={tp('password')}
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className={isArabic ? 'font-arabic' : ''}>
              {t('confirmPassword')} <span className="text-destructive">{t('required')}</span>
            </Label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              disabled={isPending}
              placeholder={tp('confirmPassword')}
              Icon={Lock}
              error={errors.confirmPassword?.message as string}
              sm={true}
              {...register('confirmPassword')}
            >
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground border-0 hover:bg-transparent"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </Input>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className={`w-full h-11 font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors mt-2 ${isArabic ? 'font-arabic' : ''}`}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('creatingAccount')}</span>
            </div>
          ) : (
            t('createAccount')
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center">
          <span className={`bg-background px-3 text-xs text-muted-foreground font-medium ${isArabic ? 'font-arabic' : ''}`}>{t('orRegisterWith')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Google Sign-In Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="h-10 border border-input hover:bg-secondary/50 text-sm font-medium bg-transparent"
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
          className="h-10 border border-input hover:bg-secondary/50 text-sm font-medium bg-transparent opacity-60 cursor-not-allowed"
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
          {t('alreadyHaveAccount')}{" "}
          <Link href={`/${locale}/login`} className="font-semibold text-primary hover:text-primary/80 transition-colors">
            {t('signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
