'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { ArrowRight, ArrowUp, Calculator, ChevronDown, Clock, Mail, MapPin, MessageCircle, Phone, Store } from 'lucide-react'

import { BrandLockup, DiamondFacet } from '@/components/brand/brand-lockup'
import { KineticHeading } from '@/components/motion/kinetic-heading'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { catalogHref, categories as catalogCategories } from '@/lib/catalog/registry'
import { CONTACT, whatsappHref } from '@/lib/contact'
import { cn } from '@/lib/utils'
import { FooterEstimator } from './footer-estimator'

/** Catalogue families with verified editorial routes (lib/catalog/registry). */
const FOOTER_FAMILIES = ['73-matieres-de-construction', '75-etancheite-bitume', '50-colles-carrelage-marbre', '72-peinture', '53-plomberie', '10-outillage', '48-outillage-carreleur']

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.1v3h2.5V21h2.9Z" />
    </svg>
  )
}
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/[0.08] lg:border-0" data-open={open}>
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between py-4 text-start text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50 lg:pointer-events-none lg:py-0 lg:pb-5"
        >
          {title}
          <ChevronDown className={cn('size-4 transition-transform lg:hidden', open && 'rotate-180')} aria-hidden="true" />
        </button>
      </h3>
      <ul className={cn('space-y-3 pb-5 text-sm lg:block lg:pb-0', open ? 'block' : 'hidden')}>{children}</ul>
    </div>
  )
}

function FooterLink({ href, children, external }: { href: string; children: ReactNode; external?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="link-underline text-white/70 transition-colors hover:text-white"
      >
        {children}
      </Link>
    </li>
  )
}

export function Footer({
  className,
  cta = 'default',
}: {
  className?: string
  /** kept for backwards compatibility with existing call sites */
  variant?: 'full' | 'compact'
  cta?: 'default' | 'home' | 'none'
}) {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('xp.footer')
  const tf = useTranslations('footer')
  const tc = useTranslations('xp.calc')
  const year = new Date().getFullYear()
  const isTransactional = /\/(checkout|cart)(\/|$)/.test(pathname)
  const showPreFooter = cta !== 'none' && !isTransactional
  const isRtl = locale === 'ar'
  const wa = whatsappHref(t('whatsappMessage'))
  const families = FOOTER_FAMILIES.map((slug) => catalogCategories.find((c) => c.slug === slug)).filter(Boolean) as typeof catalogCategories

  const scrollTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    const main = document.getElementById('main-content')
    if (main) {
      main.setAttribute('tabindex', '-1')
      main.focus({ preventScroll: true })
    }
  }

  const headline = cta === 'home' ? t('homeHeadline') : t('headline')
  const actions =
    cta === 'home'
      ? [
          { href: `/${locale}/shop`, label: t('homeCtaShop'), icon: Store, style: 'ghost' as const },
          { href: `/${locale}/calculateurs`, label: t('homeCtaEstimate'), icon: Calculator, style: 'gold' as const },
          { href: `/${locale}/contact`, label: t('homeCtaContact'), icon: Mail, style: 'ghost' as const },
        ]
      : [
          { href: `/${locale}/shop`, label: t('ctaShop'), icon: Store, style: 'ghost' as const },
          { href: `/${locale}/calculateurs`, label: t('ctaCalc'), icon: Calculator, style: 'gold' as const },
          { href: wa ?? `/${locale}/contact`, label: t('ctaAdvisor'), icon: MessageCircle, style: 'ghost' as const, external: Boolean(wa) },
        ]

  return (
    <footer data-site-footer className={cn('relative isolate bg-ink text-white', className)} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ── Stage 1 · cinematic pre-footer ─────────────────────────────── */}
      {showPreFooter ? (
        <section className="relative overflow-hidden border-b border-white/[0.06]" aria-labelledby="prefooter-title">
          <Image
            src="/utility-types/professional-workshop.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(13,13,13,0.55),rgba(13,13,13,0.94)_60%,#0d0d0d)]" aria-hidden="true" />
          <div className="bd-grid absolute inset-0 opacity-60 [--grid-color:rgba(255,255,255,0.04)]" aria-hidden="true" />

          {/* Architectural linework with a travelling golden highlight */}
          <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 1440 640" preserveAspectRatio="none" aria-hidden="true" data-draw>
            <path className="draw" pathLength={1} d="M0 520 H1440" stroke="rgba(255,255,255,0.10)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
            <path className="draw" pathLength={1} d="M180 0 V640" stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" style={{ ['--draw-delay' as string]: '200ms' }} />
            <path className="draw" pathLength={1} d="M1260 0 V640" stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" style={{ ['--draw-delay' as string]: '300ms' }} />
            <path className="draw" pathLength={1} d="M0 520 L360 120 H1080 L1440 520" stroke="url(#pf-gold)" strokeWidth="1.25" fill="none" vectorEffect="non-scaling-stroke" style={{ ['--draw-delay' as string]: '350ms' }} />
            <defs>
              <linearGradient id="pf-gold" x1="0" x2="1">
                <stop offset="0" stopColor="#f29f04" stopOpacity="0" />
                <stop offset="0.5" stopColor="#f2b705" stopOpacity="0.9" />
                <stop offset="1" stopColor="#f29f04" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative mx-auto grid max-w-[1440px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.25fr_0.9fr] lg:items-center lg:gap-16 lg:px-10 lg:py-28">
            <div>
              <p className="kicker !text-brand-yellow" data-reveal>{t('kicker')}</p>
              <KineticHeading
                id="prefooter-title"
                text={headline}
                className="display-lg mt-5 max-w-[16ch] text-[2.6rem] text-white sm:text-6xl lg:text-[4.6rem]"
              />
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg" data-reveal style={{ ['--reveal-delay' as string]: '200ms' }}>
                {t('subtitle')}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {actions.map((action, index) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    target={'external' in action && action.external ? '_blank' : undefined}
                    rel={'external' in action && action.external ? 'noopener noreferrer' : undefined}
                    data-reveal
                    style={{ ['--reveal-delay' as string]: `${300 + index * 90}ms` }}
                    className={cn(
                      'group inline-flex h-13 items-center justify-center gap-2.5 rounded-full px-6 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-300',
                      action.style === 'gold'
                        ? 'order-first bg-gold text-ink shadow-[0_18px_40px_-16px_rgba(242,159,4,0.9)] hover:-translate-y-0.5 sm:order-none'
                        : 'border border-white/15 bg-white/[0.03] text-white hover:border-white/40 hover:bg-white/[0.07]'
                    )}
                  >
                    <action.icon className="size-4" aria-hidden="true" />
                    {action.label}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
            <div data-reveal="scale" style={{ ['--reveal-delay' as string]: '250ms' }}>
              <FooterEstimator />
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Stage 2 · premium footer panel ─────────────────────────────── */}
      <div className="relative overflow-hidden">
        <DiamondFacet className="pointer-events-none absolute -end-24 top-10 hidden h-[420px] w-[500px] text-white/[0.035] lg:block" strokeWidth={1} />

        <div className="relative mx-auto max-w-[1440px] px-5 pt-14 sm:px-8 lg:px-10 lg:pt-20">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_2.85fr] lg:gap-16">
            {/* Brand + contact */}
            <div data-reveal>
              <BrandLockup compact />
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/60">{t('statement')}</p>

              <ul className="mt-8 space-y-3.5 text-sm">
                <li>
                  <a href={CONTACT.phoneHref} className="group flex items-start gap-3 text-white/80 hover:text-white">
                    <Phone className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden="true" />
                    <span>
                      <span className="block text-xs text-white/45">{tf('storeContactPhone')}</span>
                      <span dir="ltr" className="font-medium">{CONTACT.phoneDisplay}</span>
                    </span>
                  </a>
                </li>
                {wa ? (
                  <li>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-white/80 hover:text-white">
                      <MessageCircle className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden="true" />
                      <span>
                        <span className="block text-xs text-white/45">WhatsApp</span>
                        <span className="font-medium">{t('whatsappCta')}</span>
                      </span>
                    </a>
                  </li>
                ) : null}
                {CONTACT.email ? (
                  <li>
                    <a href={`mailto:${CONTACT.email}`} className="flex items-start gap-3 text-white/80 hover:text-white">
                      <Mail className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden="true" />
                      <span>
                        <span className="block text-xs text-white/45">{tf('storeContactEmail')}</span>
                        <span dir="ltr" className="break-all font-medium">{CONTACT.email}</span>
                      </span>
                    </a>
                  </li>
                ) : null}
                {CONTACT.address ? (
                  <li>
                    <a href={CONTACT.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-white/80 hover:text-white">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden="true" />
                      <span>
                        <span className="block text-xs text-white/45">{tf('storeContactAddress')}</span>
                        <span className="font-medium leading-relaxed">{CONTACT.address}</span>
                      </span>
                    </a>
                  </li>
                ) : null}
                {CONTACT.hours ? (
                  <li className="flex items-start gap-3 text-white/80">
                    <Clock className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden="true" />
                    <span>
                      <span className="block text-xs text-white/45">{tf('storeContactHours')}</span>
                      <span className="font-medium">{CONTACT.hours}</span>
                    </span>
                  </li>
                ) : null}
              </ul>

              {CONTACT.socials.length ? (
                <div className="mt-8 flex items-center gap-2">
                  {CONTACT.socials.map((social) => (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="grid size-10 place-items-center rounded-full border border-white/12 text-white/70 transition-colors hover:border-brand-orange hover:text-brand-yellow"
                    >
                      {social.kind === 'facebook' ? <FacebookIcon className="size-4" /> : <InstagramIcon className="size-4" />}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Navigation columns */}
            <div className="grid lg:grid-cols-5 lg:gap-8" data-reveal style={{ ['--reveal-delay' as string]: '120ms' }}>
              <FooterColumn title={t('colProducts')}>
                {families.map((family) => (
                  <FooterLink key={family.slug} href={catalogHref(locale, 'categories', family.id)}>
                    {(family as unknown as Record<string, string>)[locale] ?? family.fr}
                  </FooterLink>
                ))}
                <FooterLink href={`/${locale}/shop`}>{t('allProducts')}</FooterLink>
              </FooterColumn>
              <FooterColumn title={t('colServices')}>
                <FooterLink href={`/${locale}/services`}>{t('services')}</FooterLink>
                <FooterLink href={`/${locale}/maalems`}>{t('maalems')}</FooterLink>
                <FooterLink href={`/${locale}/services/request/quick`}>{t('quickRequest')}</FooterLink>
                <FooterLink href={`/${locale}/register`}>{t('becomeMaalem')}</FooterLink>
              </FooterColumn>
              <FooterColumn title={t('colTools')}>
                {(['carrelage', 'peinture', 'beton', 'etancheite'] as const).map((slug) => (
                  <FooterLink key={slug} href={`/${locale}/calculateurs/${slug}`}>{tc(`${slug}.title`)}</FooterLink>
                ))}
                <FooterLink href={`/${locale}/calculateurs/budget`}>{tc('budget.title')}</FooterLink>
                <FooterLink href={`/${locale}/projet`}>{t('planner')}</FooterLink>
                <FooterLink href={`/${locale}/studio`}>{t('studio')}</FooterLink>
                <FooterLink href={`/${locale}/calculateurs`}>{t('allTools')}</FooterLink>
              </FooterColumn>
              <FooterColumn title={t('colHelp')}>
                <FooterLink href={`/${locale}/contact`}>{t('contact')}</FooterLink>
                <FooterLink href={`/${locale}/profile`}>{t('account')}</FooterLink>
                <FooterLink href={`/${locale}/orders`}>{t('orders')}</FooterLink>
                <FooterLink href={`/${locale}/wishlist`}>{t('favorites')}</FooterLink>
                <FooterLink href={`/${locale}/cgv#cgv-clause-12`}>{tf('returnsRefunds')}</FooterLink>
              </FooterColumn>
              <FooterColumn title={t('colCompany')}>
                <FooterLink href={`/${locale}/cgv`}>{tf('termsAndConditions')}</FooterLink>
                <FooterLink href={CONTACT.mapUrl} external>{t('findUs')}</FooterLink>
                {CONTACT.reviewUrl ? <FooterLink href={CONTACT.reviewUrl} external>{t('review')}</FooterLink> : null}
                <FooterLink href={`/${locale}/links`}>{t('team')}</FooterLink>
              </FooterColumn>
            </div>
          </div>

          {/* Payments (real accepted methods) */}
          <div className="mt-14 flex flex-col gap-4 border-t border-white/[0.08] pt-8 lg:flex-row lg:items-center lg:justify-between" data-reveal="fade">
            <p className="text-xs text-white/45">{tf('acceptedPayments')}</p>
            <div className="flex flex-wrap items-center gap-2.5">
              {[
                { src: '/payments/visa.svg', alt: 'Visa', w: 52, h: 32 },
                { src: '/payments/master-card.svg', alt: 'Mastercard', w: 52, h: 32 },
                { src: '/payments/chaabi-payment.jpeg', alt: 'Chaabi Payment', w: 180, h: 120 },
                { src: '/payments/mastercard-securecode.jpeg', alt: 'Mastercard SecureCode', w: 503, h: 232 },
                { src: '/payments/verified-by-visa.jpeg', alt: 'Verified by Visa', w: 600, h: 265 },
              ].map((logo) => (
                <span key={logo.alt} className="grid h-10 place-items-center rounded-lg bg-white px-2.5">
                  <Image src={logo.src} alt={logo.alt} width={logo.w} height={logo.h} sizes="96px" className="h-6 w-auto object-contain" />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Monumental wordmark */}
        <div className="relative mx-auto max-w-[1440px] overflow-hidden px-5 sm:px-8 lg:px-10" aria-hidden="true">
          <div data-reveal="clip" className="select-none pt-10 text-center" dir="ltr">
            <p className="whitespace-nowrap text-[19vw] font-extrabold leading-[0.8] tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.12)] lg:text-[15rem]">
              BOUKIR<span className="[-webkit-text-stroke:1px_rgba(242,159,4,0.45)]">.</span>
            </p>
            <p className="mt-2 pb-2 text-[3.2vw] font-semibold tracking-[0.62em] text-brand-yellow/50 lg:text-[2.6rem]">CONSTRUCTION</p>
          </div>
        </div>

        {/* Bottom line */}
        <div className="relative border-t border-white/[0.08]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-6 text-xs text-white/50 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
            <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-5">
              <p>© {year} {CONTACT.legalName}. {t('rights')}</p>
              <p className="text-white/35" dir="ltr">
                Designed &amp; Developed by{" "}
                <a href="https://2mcrafters.com/" target="_blank" rel="noopener" className="font-medium text-white/55 underline-offset-4 transition-colors hover:text-brand-yellow hover:underline">2M Crafters</a>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href={`/${locale}/cgv`} className="link-underline hover:text-white">{t('legal')}</Link>
              <ThemeToggle tone="onDark" className="size-9" />
              <button
                type="button"
                onClick={scrollTop}
                className="group inline-flex h-9 items-center gap-2 rounded-full border border-white/12 px-3.5 text-white/75 transition-colors hover:border-brand-orange hover:text-white"
              >
                <ArrowUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
                {t('backToTop')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
