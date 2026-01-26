import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Truck, CreditCard } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function HomeHero({
  locale,
  className,
}: {
  locale: string
  className?: string
}) {
  const t = useTranslations('home')

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border/30',
        'bg-linear-to-b from-primary/10 via-background to-background',
        className
      )}
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src="/droguerie-pattern.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.08]"
        />
        <div className="absolute inset-0 bg-linear-to-b from-primary/15 via-background/70 to-background" />
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/70 px-3 py-1 text-xs text-foreground/80 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{t('heroKicker')}</span>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                {t('heroTitle')}
              </h1>
              <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-[60ch]">
                {t('heroSubtitle')}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href={`/${locale}/shop`}>
                  <Button size="lg" className="gap-2">
                    {t('ctaShop')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Link href={`/${locale}/shop?sort=promo`}>
                  <Button size="lg" variant="outline" className="gap-2">
                    {t('ctaPromos')}
                  </Button>
                </Link>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <TrustPill icon={Truck} title={t('trustDelivery')} />
                <TrustPill icon={ShieldCheck} title={t('trustSecure')} />
                <TrustPill icon={CreditCard} title={t('trustPayments')} />
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-xl shadow-black/5">
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent" />
                <div className="p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/15">
                      <Image src="/logo.png" alt="Boukir" width={28} height={28} sizes="28px" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">Boukir</div>
                      <div className="text-xs text-muted-foreground">{t('heroCardSubtitle')}</div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    <FeatureCard
                      title={t('heroCard1Title')}
                      desc={t('heroCard1Desc')}
                    />
                    <FeatureCard
                      title={t('heroCard2Title')}
                      desc={t('heroCard2Desc')}
                    />
                    <FeatureCard
                      title={t('heroCard3Title')}
                      desc={t('heroCard3Desc')}
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{t('heroCardHint')}</div>
                    <Link href={`/${locale}/shop`} className="text-sm font-semibold text-primary hover:underline underline-offset-4">
                      {t('ctaBrowse')}
                    </Link>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustPill({
  icon: Icon,
  title,
}: {
  icon: typeof Truck
  title: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background/70 px-3 py-2 shadow-sm">
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-muted/60">
        <Icon className="h-4 w-4 text-foreground/70" />
      </div>
      <div className="text-xs font-medium text-foreground/90 leading-snug">
        {title}
      </div>
    </div>
  )
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/70 p-4">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </div>
  )
}
