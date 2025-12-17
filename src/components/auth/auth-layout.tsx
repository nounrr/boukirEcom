"use client"

import type React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  const t = useTranslations('auth')
  
  return (
    <div className="max-h-screen min-h-screen flex items-center justify-center lg:justify-start bg-background p-4 lg:p-8 overflow-hidden">
      {/* Left side - Gradient card centered */}
      <div className="hidden lg:flex items-center justify-center w-full lg:w-[45%] xl:w-[40%] h-[85vh] bg-gradient-to-br from-[#E8A626] via-[#D99323] to-[#D68820] rounded-[40px] shadow-2xl p-8 ltr:lg:ml-12 ltr:xl:ml-16 rtl:lg:mr-12 rtl:xl:mr-16 overflow-hidden relative">
        {/* Pattern Image Background */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-[40px]">
          <Image
            src="/droguerie-pattern.png"
            alt=""
            fill
            className="object-cover opacity-[0.08] mix-blend-overlay"
            priority
          />
        </div>
        
        <div className="w-full max-w-md text-center space-y-8 px-4 text-white relative z-10">
          {/* Logo Container - Centered with border radius */}
          <div className="flex justify-center">
            <div className="w-40 h-40 bg-white rounded-4xl shadow-2xl p-5 flex items-center justify-center">
              <Image src="/logo.png" alt="Logo" width={140} height={140} priority className="object-contain" />
            </div>
          </div>

          {/* Brand Content */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent drop-shadow-sm">
              {t('welcome')}
            </h1>
            <p className="text-lg leading-relaxed bg-gradient-to-r from-white/95 to-white/85 bg-clip-text text-transparent">
              {t('platformDescription')}
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-8 py-6 border-y border-white/20">
            <div className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">10K+</p>
              <p className="text-sm mt-1 text-white/85">{t('users')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">5K+</p>
              <p className="text-sm mt-1 text-white/85">{t('clients')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">24/7</p>
              <p className="text-sm mt-1 text-white/85">{t('support')}</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-white/90">{t('fastDelivery')}</p>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-white/90">{t('loyaltyProgram')}</p>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-white/90">{t('securePayment')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form with more padding */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[55%] xl:w-[60%] min-h-screen px-6 sm:px-12 lg:px-16 xl:px-24 py-8">
        <div className="w-full max-w-xl">
          {/* Mobile/Tablet Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg p-3 flex items-center justify-center border-2 border-primary/10">
              <Image src="/logo.png" alt="Logo" width={85} height={85} priority className="object-contain" />
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
