import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { KineticHeading } from '@/components/motion/kinetic-heading'
import { PlannerClient } from '@/components/tools/planner/planner-client'
import { normalizeLocale } from '@/i18n/locale'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = normalizeLocale(raw)
  const t = await getTranslations({ locale, namespace: 'xp.planner' })
  return buildPageMetadata({ locale, path: '/projet', title: t('metaTitle'), description: t('lead') })
}

export default async function PlannerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = normalizeLocale(raw)
  const t = await getTranslations({ locale, namespace: 'xp.planner' })

  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-border bg-surface">
        <div className="bd-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1100px] px-4 pb-12 pt-12 sm:px-6 lg:pb-16 lg:pt-16">
          <p className="kicker" data-reveal>{t('kicker')}</p>
          <KineticHeading as="h1" text={t('title')} className="display-lg mt-4 max-w-[18ch] text-4xl sm:text-6xl" />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground" data-reveal style={{ ['--reveal-delay' as string]: '200ms' }}>{t('lead')}</p>
        </div>
      </section>
      <div className="pt-10">
        <PlannerClient />
      </div>
    </div>
  )
}
