import type { Metadata } from 'next'
import { Clock, MapPin, Navigation, Phone } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { FlagshipStore } from '@/components/home/flagship/flagship-store'
import { AppDownloadSection } from '@/components/store/app-download-section'
import { WhatsAppIcon } from '@/components/store/brand-icons'
import { StoreGallery } from '@/components/store/store-gallery'
import { StoreSocials } from '@/components/store/store-socials'
import { StoreVideos } from '@/components/store/store-videos'
import { normalizeLocale } from '@/i18n/locale'
import { CONTACT, whatsappHref } from '@/lib/contact'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { STORE_PHOTOS, STORE_VIDEOS } from '@/lib/store-media'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale)
  const t = await getTranslations({ locale, namespace: 'storePage' })
  return buildPageMetadata({
    locale,
    title: t('metadata.title'),
    description: t('metadata.description'),
    path: '/magasin',
    imageUrl: STORE_PHOTOS[0].src,
  })
}

export default async function StorePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = normalizeLocale((await params).locale)
  const t = await getTranslations({ locale, namespace: 'storePage' })
  const wa = whatsappHref(t('socials.whatsappMessage'))
  const heroVideo = STORE_VIDEOS[0]

  return (
    <>
      {/* En-tête : vidéo du magasin en fond */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <video
          src={heroVideo.src}
          poster={heroVideo.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full object-cover motion-reduce:hidden"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/85 via-black/60 to-black/20 rtl:bg-linear-to-l" aria-hidden="true" />
        <div className="mx-auto flex min-h-[70vh] max-w-[1440px] flex-col justify-end px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="kicker flex items-center gap-3 !text-brand-yellow">
            <span className="h-px w-8 bg-brand-yellow" aria-hidden="true" />{t('hero.kicker')}
          </p>
          <h1 className="display-lg mt-4 max-w-[14ch] text-5xl sm:text-6xl lg:text-7xl">{t('hero.title')}</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{t('hero.description')}</p>
          <dl className="mt-8 grid max-w-3xl gap-4 text-sm sm:grid-cols-3">
            <div className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 fill-white text-brand-yellow" aria-hidden="true" /><div><dt className="text-xs text-white/50">{t('hero.address')}</dt><dd className="mt-1 font-medium leading-relaxed">{CONTACT.address}</dd></div></div>
            <div className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 fill-white text-brand-yellow" aria-hidden="true" /><div><dt className="text-xs text-white/50">{t('hero.phone')}</dt><dd className="mt-1 font-medium" dir="ltr"><a href={CONTACT.phoneHref} className="hover:text-brand-yellow">{CONTACT.phoneDisplay}</a></dd></div></div>
            {CONTACT.hours ? <div className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 fill-white text-brand-yellow" aria-hidden="true" /><div><dt className="text-xs text-white/50">{t('hero.hours')}</dt><dd className="mt-1 font-medium">{CONTACT.hours}</dd></div></div> : null}
          </dl>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href={CONTACT.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-ink">
              <Navigation className="size-4 rtl:-scale-x-100" aria-hidden="true" />{t('hero.directions')}
            </a>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25d366] px-6 text-sm font-semibold text-[#073b1c]">
                <WhatsAppIcon className="size-5" />{t('hero.whatsapp')}
              </a>
            ) : null}
            <a href="#galerie" className="inline-flex h-12 items-center rounded-full border border-white/30 px-6 text-sm font-semibold text-white hover:bg-white/10">
              {t('hero.seePhotos')}
            </a>
          </div>
        </div>
      </section>

      {/* Photos */}
      <section id="galerie" className="scroll-mt-32 py-16 lg:py-24" aria-labelledby="galerie-title">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
          <p className="kicker flex items-center gap-3 !text-[var(--accent-text)]"><span className="h-px w-8 bg-current" aria-hidden="true" />{t('gallery.kicker')}</p>
          <h2 id="galerie-title" className="display-lg mt-4 text-4xl sm:text-5xl">{t('gallery.title')}</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">{t('gallery.description')}</p>
          <div className="mt-10"><StoreGallery /></div>
        </div>
      </section>

      {/* Vidéos */}
      <section className="bg-surface-2/60 py-16 lg:py-24" aria-labelledby="videos-title">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
          <p className="kicker flex items-center gap-3 !text-[var(--accent-text)]"><span className="h-px w-8 bg-current" aria-hidden="true" />{t('videos.kicker')}</p>
          <h2 id="videos-title" className="display-lg mt-4 text-4xl sm:text-5xl">{t('videos.title')}</h2>
          <div className="mt-10"><StoreVideos /></div>
        </div>
      </section>

      {/* Réseaux */}
      <section className="py-16 lg:py-24" aria-labelledby="socials-title">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
          <p className="kicker flex items-center gap-3 !text-[var(--accent-text)]"><span className="h-px w-8 bg-current" aria-hidden="true" />{t('socials.kicker')}</p>
          <h2 id="socials-title" className="display-lg mt-4 text-4xl sm:text-5xl">{t('socials.title')}</h2>
          <div className="mt-10"><StoreSocials locale={locale} /></div>
        </div>
      </section>

      {/* Application mobile */}
      <AppDownloadSection locale={locale} />

      {/* Plan et coordonnées */}
      <FlagshipStore />
    </>
  )
}
