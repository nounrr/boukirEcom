import type { Metadata } from 'next'

import { normalizeLocale, type AppLocale } from '@/i18n/locale'
import { cgvContent, CGV_EFFECTIVE_DATE, seller } from '@/lib/cgv/content'
import { buildPageMetadata } from '@/lib/seo/metadata'

type Props = { params: Promise<{ locale: string }> }

const navigationLabels: Record<AppLocale, { contents: string; skip: string; clauses: string }> = {
  fr: { contents: 'Sommaire', skip: 'Aller aux conditions', clauses: 'Les conditions' },
  ar: { contents: 'فهرس المحتويات', skip: 'الانتقال إلى الشروط', clauses: 'بنود الشروط' },
  en: { contents: 'Contents', skip: 'Skip to the terms', clauses: 'The terms' },
  zh: { contents: '目录', skip: '跳至条款', clauses: '条款正文' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)
  const copy = cgvContent[locale]

  return buildPageMetadata({
    locale,
    path: '/cgv',
    title: copy.title,
    description: copy.intro,
    indexable: true,
  })
}

export default async function CgvPage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)
  const copy = cgvContent[locale]
  const labels = navigationLabels[locale]
  const isArabic = locale === 'ar'
  const sellerValues = [
    seller.name,
    seller.form,
    seller.capital,
    seller.rc,
    seller.if,
    seller.ice,
    seller.address,
    seller.email,
    `${seller.mobile} · ${seller.phone}`,
  ] as const
  const contentsList = (
    <ol className="mt-4 grid max-h-[min(70vh,38rem)] gap-0.5 overflow-y-auto pe-2 text-sm sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-1">
      {copy.sections.map(([title], index) => (
        <li key={index}>
          <a
            href={`#cgv-clause-${index + 1}`}
            className="block border-s-2 border-transparent py-1.5 ps-3 leading-5 text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:border-primary focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {title}
          </a>
        </li>
      ))}
    </ol>
  )

  return (
    <div lang={locale} dir={isArabic ? 'rtl' : 'ltr'} className="bg-background text-foreground">
      <a
        href="#cgv-clauses"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {labels.skip}
      </a>

      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pb-28">
        <header className="max-w-4xl border-b border-border pb-10 sm:pb-12">
          <div className="mb-6 h-1 w-14 bg-primary print:bg-black" aria-hidden="true" />
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            {copy.intro}
          </p>
          <p className="mt-6 text-sm font-medium text-foreground">
            <time dateTime={CGV_EFFECTIVE_DATE}>{copy.updated}</time>
          </p>
        </header>

        <section aria-labelledby="seller-heading" className="mt-10 max-w-5xl border border-border bg-card p-5 sm:p-8 print:border-black">
          <h2 id="seller-heading" className="text-lg font-semibold sm:text-xl">
            {copy.legalIdentity}
          </h2>
          <dl className="mt-5 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {copy.labels.map((label, index) => (
              <div key={label} className="min-w-0 border-t border-border py-3.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-1.5 break-words text-sm font-medium leading-6 sm:text-[15px]">
                  {index === 7 ? (
                    <a className="underline decoration-primary underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={`mailto:${seller.email}`} dir="ltr">
                      {seller.email}
                    </a>
                  ) : index === 8 ? (
                    <span className="flex flex-wrap gap-x-2" dir="ltr">
                      <a className="underline decoration-primary underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={`tel:${seller.mobile.replace(/\s/g, '')}`}>{seller.mobile}</a>
                      <span aria-hidden="true">·</span>
                      <a className="underline decoration-primary underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={`tel:${seller.phone.replace(/\s/g, '')}`}>{seller.phone}</a>
                    </span>
                  ) : (
                    <bdi dir="auto">{sellerValues[index]}</bdi>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label={labels.contents} className="border-t-2 border-primary pt-5 print:hidden lg:hidden">
            <details>
              <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.12em] marker:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                {labels.contents}
              </summary>
              {contentsList}
            </details>
          </nav>
          <nav aria-label={labels.contents} className="hidden border-t-2 border-primary pt-5 print:hidden lg:sticky lg:top-8 lg:block">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">{labels.contents}</h2>
            {contentsList}
          </nav>

          <article id="cgv-clauses" className="min-w-0 max-w-3xl scroll-mt-8" aria-label={labels.clauses}>
            {copy.sections.map(([title, body], index) => (
              <section
                key={index}
                id={`cgv-clause-${index + 1}`}
                aria-labelledby={`cgv-heading-${index + 1}`}
                className="scroll-mt-8 border-t border-border py-7 first:border-t-2 first:border-primary first:pt-7 sm:py-8 print:break-inside-avoid"
              >
                <h2 id={`cgv-heading-${index + 1}`} className="text-lg font-semibold leading-7 tracking-tight sm:text-xl">
                  {title}
                </h2>
                <p className="mt-3 text-[15px] leading-8 text-foreground/85 sm:text-base sm:leading-8">
                  {body}
                </p>
              </section>
            ))}
          </article>
        </div>
      </div>

      <style>{`@media print {
        @page { margin: 18mm; }
        html { scroll-behavior: auto; }
        #cgv-clauses { max-width: none; }
        #cgv-clauses section { break-inside: avoid; }
        a { color: inherit; text-decoration: none; }
      }`}</style>
    </div>
  )
}
