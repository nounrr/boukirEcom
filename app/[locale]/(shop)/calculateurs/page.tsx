import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, ClipboardList, PencilRuler, ShieldCheck } from 'lucide-react'

import { DiamondFacet } from '@/components/brand/brand-lockup'
import { KineticHeading } from '@/components/motion/kinetic-heading'
import { TOOL_ICONS } from '@/components/tools/tool-icons'
import { normalizeLocale } from '@/i18n/locale'
import { CALCULATORS, EXTRA_TOOLS } from '@/lib/calculators/registry'
import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = normalizeLocale(raw)
  const t = await getTranslations({ locale, namespace: 'xp.tools' })
  return buildPageMetadata({ locale, path: '/calculateurs', title: t('hubMetaTitle'), description: t('hubMetaDescription') })
}

export default async function CalculatorsHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = normalizeLocale(raw)
  const t = await getTranslations({ locale, namespace: 'xp.tools' })
  const tc = await getTranslations({ locale, namespace: 'xp.calc' })

  const families = (['surfaces', 'structure', 'finishes'] as const).map((family) => ({
    family,
    items: CALCULATORS.filter((c) => c.family === family),
  }))

  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="bd-grid absolute inset-0 [--grid-color:rgba(255,255,255,0.05)]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_80%_20%,rgba(242,159,4,0.18),transparent_60%)]" aria-hidden="true" />
        <div className="absolute -end-10 top-6 hidden h-[380px] w-[460px] text-brand-orange/25 lg:block" data-draw aria-hidden="true">
          <DiamondFacet className="size-full" strokeWidth={1.2} />
        </div>
        <div className="relative mx-auto max-w-[1440px] px-5 pb-16 pt-14 sm:px-8 lg:px-10 lg:pb-24 lg:pt-20">
          <p className="kicker !text-brand-yellow" data-reveal>{t('hubKicker')}</p>
          <KineticHeading as="h1" text={t('hubTitle')} className="display-xl mt-5 max-w-[14ch] text-5xl sm:text-7xl lg:text-[5.5rem]" />
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65" data-reveal style={{ ['--reveal-delay' as string]: '200ms' }}>
            {t('hubLead')}
          </p>
          <ul className="mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4" data-reveal style={{ ['--reveal-delay' as string]: '300ms' }}>
            {(['stat1', 'stat2', 'stat3', 'stat4'] as const).map((key) => (
              <li key={key} className="bg-ink/90 p-4">
                <p className="text-2xl font-extrabold text-white">{t(`stats.${key}.value`)}</p>
                <p className="mt-1 text-xs text-white/55">{t(`stats.${key}.label`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        {/* Featured experiences */}
        <section className="-mt-8 grid gap-4 lg:grid-cols-3" aria-label={t('featuredLabel')}>
          {[
            { href: `/${locale}/studio`, icon: PencilRuler, title: t('studioTitle'), desc: t('studioDesc'), accent: true },
            { href: `/${locale}/projet`, icon: ClipboardList, title: t('plannerTitle'), desc: t('plannerDesc') },
            { href: `/${locale}/calculateurs/budget`, icon: TOOL_ICONS.budget, title: tc('budget.title'), desc: tc('budget.desc') },
          ].map((card, index) => (
            <Link
              key={card.href}
              href={card.href}
              data-reveal
              style={{ ['--reveal-delay' as string]: `${index * 90}ms` }}
              className={
                'group relative overflow-hidden rounded-3xl border p-6 shadow-premium transition-transform duration-500 hover:-translate-y-1 sm:p-7 ' +
                (card.accent ? 'border-brand-orange/40 bg-gold text-ink' : 'border-border bg-surface')
              }
            >
              <card.icon className="size-7" strokeWidth={1.5} aria-hidden="true" />
              <h2 className="mt-8 text-xl font-bold">{card.title}</h2>
              <p className={'mt-2 text-sm leading-relaxed ' + (card.accent ? 'text-ink/75' : 'text-muted-foreground')}>{card.desc}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                {t('open')}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </section>

        {/* Calculators by family */}
        {families.map(({ family, items }) => (
          <section key={family} className="mt-16 lg:mt-20" aria-labelledby={`fam-${family}`}>
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="kicker">{t(`families.${family}.kicker`)}</p>
                <h2 id={`fam-${family}`} className="display-lg mt-2 text-3xl sm:text-4xl">{t(`families.${family}.title`)}</h2>
              </div>
              <p className="hidden max-w-sm text-sm text-muted-foreground md:block">{t(`families.${family}.desc`)}</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((calc, index) => {
                const Icon = TOOL_ICONS[calc.slug]
                return (
                  <li key={calc.slug} data-reveal style={{ ['--reveal-delay' as string]: `${index * 70}ms` }}>
                    <Link
                      href={`/${locale}/calculateurs/${calc.slug}`}
                      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface p-6 transition-[border-color,transform,box-shadow] duration-500 hover:-translate-y-1 hover:border-primary/50 hover:shadow-premium"
                    >
                      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-foreground transition-colors duration-500 group-hover:bg-gold group-hover:text-ink">
                        <Icon className="size-6" strokeWidth={1.5} aria-hidden="true" />
                      </span>
                      <h3 className="mt-6 text-lg font-bold">{tc(`${calc.slug}.title`)}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{tc(`${calc.slug}.short`)}</p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-text">
                        {t('open')}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
                      </span>
                      <span className="pointer-events-none absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100 rtl:origin-right" aria-hidden="true" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        {/* Utilities */}
        <section className="mt-16 lg:mt-20" aria-labelledby="fam-utilities">
          <div className="mb-6 border-b border-border pb-4">
            <p className="kicker">{t('families.planning.kicker')}</p>
            <h2 id="fam-utilities" className="display-lg mt-2 text-3xl sm:text-4xl">{t('families.planning.title')}</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {EXTRA_TOOLS.map((slug) => {
              const Icon = TOOL_ICONS[slug]
              return (
                <li key={slug} data-reveal>
                  <Link href={`/${locale}/calculateurs/${slug}`} className="group flex items-center gap-5 rounded-3xl border border-border bg-surface p-6 transition-colors hover:border-primary/50">
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink text-brand-yellow">
                      <Icon className="size-6" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-bold">{tc(`${slug}.title`)}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{tc(`${slug}.short`)}</span>
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <aside className="mt-16 flex gap-4 rounded-3xl border border-border bg-muted/50 p-6 sm:p-8" data-reveal>
          <ShieldCheck className="mt-0.5 size-6 shrink-0 text-accent-text" aria-hidden="true" />
          <div>
            <h2 className="font-bold">{t('disclaimerTitle')}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">{t('disclaimerLong')}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
