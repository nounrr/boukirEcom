'use client'

import { ArrowRight, Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

const DEFAULT_MAP_URL =
  'https://www.google.com/maps/place/BOUKIR+DIAMOND+CONSTUCTION+STORE/@35.7532036,-5.8421462,1453m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd0b87005196739b:0xfa8dc0aeae136e27!8m2!3d35.7532036!4d-5.8421462!16s%2Fg%2F11y45mc9yr?entry=ttu'
const DEFAULT_QUERY = 'BOUKIR DIAMOND CONSTUCTION STORE'
const DEFAULT_PHONE = '0650812894'
const DEFAULT_EMAIL = 'boukir.diamond23@gmail.com'
const DEFAULT_ADDRESS = 'IKAMAT REDOUAN 1 AZIB HAJ KADDOUR LOCAL 1 ET N2 - TANGER'

function buildEmbedUrl(query: string) {
  const safeQuery = query.trim() || 'Boukir'
  return `https://www.google.com/maps?q=${encodeURIComponent(safeQuery)}&output=embed`
}

function phoneNumber(value: string) {
  const match = value.match(/(?:\+?212|0)[\d\s.]{8,}/)
  return (match?.[0] ?? value.split('-')[0] ?? value).replace(/[^0-9+]/g, '')
}

export function ProfessionalStore({ locale }: { locale: string }) {
  const t = useTranslations('footer')
  const isRtl = locale === 'ar'
  const mapUrl = (process.env.NEXT_PUBLIC_STORE_MAP_URL || DEFAULT_MAP_URL).trim()
  const mapQuery = (process.env.NEXT_PUBLIC_STORE_MAP_QUERY || DEFAULT_QUERY).trim()
  const embedUrl = buildEmbedUrl(mapQuery)
  const phoneRaw = (process.env.NEXT_PUBLIC_STORE_PHONE || process.env.NEXT_PUBLIC_STORE_PHONES || DEFAULT_PHONE).trim()
  const phone = phoneNumber(phoneRaw)
  const email = (process.env.NEXT_PUBLIC_STORE_EMAIL || DEFAULT_EMAIL).trim()
  const address = (process.env.NEXT_PUBLIC_STORE_ADDRESS || DEFAULT_ADDRESS).trim()
  const hours = (process.env.NEXT_PUBLIC_STORE_HOURS || '').trim()

  return (
    <section className="bg-[#f2efe8] py-10 dark:bg-background md:py-20" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-5 sm:px-8 lg:px-16">
        <div className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          <span>06</span><span className="h-px w-10 bg-primary" /><span>{t('storeLocationTitle')}</span>
        </div>
        <div className="grid overflow-hidden border border-[#d7c895] bg-[#efe4bd] lg:grid-cols-[0.72fr_1.28fr]">
          <div className="flex flex-col justify-between p-6 text-foreground sm:p-9 lg:min-h-[470px] lg:p-12">
            <div>
              <MapPin className="h-7 w-7 text-primary" strokeWidth={1.7} />
              <h2 className="mt-6 max-w-md text-3xl font-black tracking-[-0.035em] sm:text-4xl">Boukir Diamond<br /><span className="text-foreground/48">Construction Store</span></h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-foreground/65">{t('storeLocationDesc')}</p>
            </div>

            <dl className="mt-10 divide-y divide-[#cfbd82] border-y border-[#cfbd82] text-sm">
              {address ? (
                <div className="grid grid-cols-[24px_1fr] gap-3 py-4">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <div><dt className="text-xs text-foreground/50">{t('storeContactAddress')}</dt><dd className="mt-1 font-semibold leading-6 text-foreground/88">{address}</dd></div>
                </div>
              ) : null}
              {phone ? (
                <div className="grid grid-cols-[24px_1fr] gap-3 py-4">
                  <Phone className="mt-0.5 h-4 w-4 text-primary" />
                  <div><dt className="text-xs text-foreground/50">{t('storeContactPhone')}</dt><dd className="mt-1 font-semibold text-foreground/88" dir="ltr">{phoneRaw}</dd></div>
                </div>
              ) : null}
              {email ? (
                <div className="grid grid-cols-[24px_1fr] gap-3 py-4">
                  <Mail className="mt-0.5 h-4 w-4 text-primary" />
                  <div><dt className="text-xs text-foreground/50">{t('storeContactEmail')}</dt><dd className="mt-1 break-all font-semibold text-foreground/88" dir="ltr">{email}</dd></div>
                </div>
              ) : null}
              {hours ? (
                <div className="grid grid-cols-[24px_1fr] gap-3 py-4">
                  <Clock className="mt-0.5 h-4 w-4 text-primary" />
                  <div><dt className="text-xs text-foreground/50">{t('storeContactHours')}</dt><dd className="mt-1 font-semibold text-foreground/88">{hours}</dd></div>
                </div>
              ) : null}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
                {t('openInMaps')}<ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
              </a>
              {phone ? <a href={`tel:${phone}`} className="inline-flex h-12 items-center gap-2 border border-foreground/25 bg-white/25 px-5 text-sm font-bold text-foreground transition-colors hover:border-foreground/50 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Phone className="h-4 w-4" />{t('storeContactTitle')}</a> : null}
            </div>
          </div>
          <div className="relative min-h-[250px] overflow-hidden border-t border-[#d7c895] bg-[#e7dfce] lg:min-h-[470px] lg:border-s lg:border-t-0">
            <iframe
              title={`${t('storeLocationTitle')} — Boukir Diamond`}
              src={embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full border-0"
              allowFullScreen
            />
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute end-5 top-5 z-10 inline-flex items-center gap-2 border border-[#d7c895] bg-[#fffdf7]/95 px-4 py-3 text-sm font-bold text-foreground shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:end-7 sm:top-7"
            >
              {t('openInMaps')}
              <Navigation className={cn('h-4 w-4 text-primary', isRtl && 'rotate-180')} />
            </a>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-primary" />
          </div>
        </div>
      </div>
    </section>
  )
}
