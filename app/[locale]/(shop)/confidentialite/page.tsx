import type { Metadata } from 'next'

import { normalizeLocale } from '@/i18n/locale'
import { privacyContent, PRIVACY_EFFECTIVE_DATE } from '@/lib/privacy/content'
import { buildPageMetadata } from '@/lib/seo/metadata'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)
  const copy = privacyContent[locale]
  return buildPageMetadata({ locale, path: '/confidentialite', title: copy.title, description: copy.intro, indexable: true })
}

/** Privacy policy of the site and the app, with the account-deletion section the stores link to. */
export default async function PrivacyPage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)
  const copy = privacyContent[locale]
  const anchorOf = (index: number, anchor?: string) => anchor ?? `privacy-${index + 1}`

  return (
    <div lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:pb-28">
        <header className="border-b border-border pb-10">
          <div className="mb-6 h-1 w-14 bg-primary" aria-hidden="true" />
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{copy.title}</h1>
          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">{copy.intro}</p>
          <p className="mt-6 text-sm font-medium">
            <time dateTime={PRIVACY_EFFECTIVE_DATE}>{copy.updated}</time>
          </p>
        </header>

        <nav aria-label={copy.contents} className="mt-8 border-t-2 border-primary pt-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">{copy.contents}</h2>
          <ol className="mt-4 grid gap-0.5 text-sm sm:grid-cols-2 sm:gap-x-6">
            {copy.sections.map(([title, , anchor], index) => (
              <li key={index}>
                <a href={`#${anchorOf(index, anchor)}`} className="block border-s-2 border-transparent py-1.5 ps-3 text-muted-foreground hover:border-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary">
                  {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="mt-10">
          {copy.sections.map(([title, body, anchor], index) => (
            <section
              key={index}
              id={anchorOf(index, anchor)}
              aria-labelledby={`${anchorOf(index, anchor)}-h`}
              className={`scroll-mt-8 border-t border-border py-7 sm:py-8 ${anchor ? 'rounded-md border-2 border-primary/60 bg-card px-5' : ''}`}
            >
              <h2 id={`${anchorOf(index, anchor)}-h`} className="text-lg font-semibold leading-7 tracking-tight sm:text-xl">
                {title}
              </h2>
              <p className="mt-3 text-[15px] leading-8 text-foreground/85 sm:text-base">{body}</p>
            </section>
          ))}
        </article>
      </div>
    </div>
  )
}
