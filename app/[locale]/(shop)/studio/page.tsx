import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { DiamondFacet } from '@/components/brand/brand-lockup'
import { KineticHeading } from '@/components/motion/kinetic-heading'
import { StudioClient } from '@/components/tools/studio/studio-client'
import { normalizeLocale } from '@/i18n/locale'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = normalizeLocale(raw)
  const t = await getTranslations({ locale, namespace: 'xp.studio' })
  return buildPageMetadata({ locale, path: '/studio', title: t('metaTitle'), description: t('lead') })
}

export default async function StudioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = normalizeLocale(raw)
  const t = await getTranslations({ locale, namespace: 'xp.studio' })

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="bd-grid-fine absolute inset-0 [--grid-color:rgba(255,255,255,0.035)]" aria-hidden="true" />
        <div className="bd-grid absolute inset-0 [--grid-color:rgba(255,255,255,0.05)]" aria-hidden="true" />
        <div className="absolute -end-16 -top-10 hidden h-[360px] w-[440px] text-brand-orange/25 lg:block" data-draw aria-hidden="true">
          <DiamondFacet className="size-full" strokeWidth={1} />
        </div>
        <div className="relative mx-auto max-w-[1440px] px-5 pb-14 pt-14 sm:px-8 lg:px-10 lg:pb-20 lg:pt-20">
          <p className="kicker !text-brand-yellow" data-reveal>{t('kicker')}</p>
          <KineticHeading as="h1" text={t('title')} className="display-xl mt-5 max-w-[14ch] text-5xl sm:text-7xl" />
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65" data-reveal style={{ ['--reveal-delay' as string]: '200ms' }}>{t('lead')}</p>
        </div>
      </section>
      <div className="pt-2">
        <StudioClient />
      </div>
    </div>
  )
}
