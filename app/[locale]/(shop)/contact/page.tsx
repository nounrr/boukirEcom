import { getTranslations } from 'next-intl/server'
import { Building2, Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { normalizeLocale } from '@/i18n/locale'
import { buildPageMetadata, getSiteUrl, localizedPath } from '@/lib/seo/metadata'

const DEFAULT_STORE_MAP_URL =
  'https://www.google.com/maps/place/BOUKIR+DIAMOND+CONSTUCTION+STORE/@35.7532036,-5.8421462,1453m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd0b87005196739b:0xfa8dc0aeae136e27!8m2!3d35.7532036!4d-5.8421462!16s%2Fg%2F11y45mc9yr?entry=ttu'
const DEFAULT_STORE_QUERY = 'BOUKIR DIAMOND CONSTUCTION STORE'

const DEFAULT_SELLER = {
  name: 'BOUKIR DIAMOND',
  subtitle: 'CONSTRUCTION STORE',
  activity: 'Vente de Matériaux de Construction céramique, et de Marbre',
  phones: 'GSM: 0650812894 - Tél: 0666216657',
  address: 'IKAMAT REDOUAN 1 AZIB HAJ KADDOUR LOCAL 1 ET N2 - TANGER',
  email: 'boukir.diamond23@gmail.com',
  serviceCharge: '06.66.21.66.57',
}

function buildEmbedUrl(query: string) {
  const safeQuery = query?.trim() ? query.trim() : 'Boukir'
  return `https://www.google.com/maps?q=${encodeURIComponent(safeQuery)}&output=embed`
}

function normalizePhoneNumber(value: string) {
  return value.replace(/[^0-9+]/g, '')
}

function parsePhones(raw: string): Array<{ label: string; number: string }> {
  const text = raw?.trim() ? raw.trim() : ''
  if (!text) return []

  const gsmMatch = text.match(/GSM\s*:\s*([0-9\s]+)/i)
  const telMatch = text.match(/T(?:e|é)l\s*:\s*([0-9\s]+)/i)
  const out: Array<{ label: string; number: string }> = []

  if (gsmMatch?.[1]) {
    const n = normalizePhoneNumber(gsmMatch[1])
    if (n) out.push({ label: 'GSM', number: n })
  }
  if (telMatch?.[1]) {
    const n = normalizePhoneNumber(telMatch[1])
    if (n) out.push({ label: 'Tél', number: n })
  }

  if (out.length > 0) return out

  const parts = text
    .split(/[-|•/]/g)
    .map((p) => normalizePhoneNumber(p))
    .filter(Boolean)

  if (parts.length === 0) return []
  if (parts.length === 1) return [{ label: 'Téléphone', number: parts[0] }]
  return [
    { label: 'GSM', number: parts[0] },
    { label: 'Tél', number: parts[1] },
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)

  const titleByLocale: Record<string, string> = {
    fr: 'Contact',
    ar: 'اتصل بنا',
    en: 'Contact',
    zh: '联系我们',
  }

  const descriptionByLocale: Record<string, string> = {
    fr: 'Contactez Boukir Diamond (Tanger) : téléphones, email, adresse et plan Google Maps.',
    ar: 'تواصل مع Boukir Diamond (طنجة): أرقام الهاتف والبريد الإلكتروني والعنوان وخريطة Google.',
    en: 'Contact Boukir Diamond (Tangier): phone numbers, email, address and Google Maps location.',
    zh: '联系 Boukir Diamond（丹吉尔）：电话、邮箱、地址与 Google 地图位置。',
  }

  const keywordsByLocale: Record<string, string[]> = {
    fr: ['contact', 'Boukir Diamond', 'Tanger', 'téléphone', 'adresse', 'Google Maps'],
    ar: ['اتصال', 'Boukir Diamond', 'طنجة', 'هاتف', 'عنوان', 'خرائط Google'],
    en: ['contact', 'Boukir Diamond', 'Tangier', 'phone', 'address', 'Google Maps'],
    zh: ['联系', 'Boukir Diamond', '丹吉尔', '电话', '地址', 'Google 地图'],
  }

  return buildPageMetadata({
    locale,
    path: '/contact',
    title: titleByLocale[locale] ?? titleByLocale.fr,
    description: descriptionByLocale[locale] ?? descriptionByLocale.fr,
    keywords: keywordsByLocale[locale] ?? keywordsByLocale.fr,
    indexable: true,
  })
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)
  const t = await getTranslations({ locale, namespace: 'contactPage' })

  const mapsUrl = (process.env.NEXT_PUBLIC_STORE_MAP_URL || DEFAULT_STORE_MAP_URL).trim()
  const query = (process.env.NEXT_PUBLIC_STORE_MAP_QUERY || DEFAULT_STORE_QUERY).trim()
  const embedUrl = buildEmbedUrl(query)

  const sellerName = (process.env.NEXT_PUBLIC_STORE_NAME || DEFAULT_SELLER.name).trim()
  const sellerSubtitle = (process.env.NEXT_PUBLIC_STORE_SUBTITLE || DEFAULT_SELLER.subtitle).trim()
  const sellerActivity = (process.env.NEXT_PUBLIC_STORE_ACTIVITY || DEFAULT_SELLER.activity).trim()

  const phonesRaw = (
    process.env.NEXT_PUBLIC_STORE_PHONES ||
    process.env.NEXT_PUBLIC_STORE_PHONE ||
    DEFAULT_SELLER.phones
  ).trim()
  const phones = (() => {
    const parsed = parsePhones(phonesRaw)
    const seen = new Set<string>()
    return parsed.filter((p) => {
      const key = normalizePhoneNumber(p.number)
      if (!key) return false
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })()

  const email = (process.env.NEXT_PUBLIC_STORE_EMAIL || DEFAULT_SELLER.email).trim()
  const address = (process.env.NEXT_PUBLIC_STORE_ADDRESS || DEFAULT_SELLER.address).trim()
  const hours = (process.env.NEXT_PUBLIC_STORE_HOURS || '').trim()
  const serviceCharge = (process.env.NEXT_PUBLIC_STORE_SERVICE_CHARGE || DEFAULT_SELLER.serviceCharge).trim()
  const serviceChargeTel = serviceCharge ? normalizePhoneNumber(serviceCharge) : ''
  const hasServiceCharge = Boolean(
    serviceCharge &&
    serviceChargeTel &&
    !phones.some((p) => normalizePhoneNumber(p.number) === serviceChargeTel)
  )

  const siteUrl = getSiteUrl()
  const pageUrl = new URL(localizedPath(locale, '/contact'), siteUrl).toString()
  const logoUrl = new URL('/logo.png', siteUrl).toString()

  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': pageUrl,
    name: sellerName,
    url: pageUrl,
    image: logoUrl,
    hasMap: mapsUrl || undefined,
    email: email || undefined,
    telephone: phones.map((p) => p.number).filter(Boolean),
    address: address
      ? {
          '@type': 'PostalAddress',
          streetAddress: address,
        }
      : undefined,
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-primary/10 via-primary/5 to-background" />
        <div className="relative container mx-auto px-6 sm:px-8 lg:px-16 py-14 md:py-18">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              {t('badge')}
            </p>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              {t('title')}
              <span className="text-primary"> {sellerName}</span>
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground">{t('description')}</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 sm:px-8 lg:px-16 py-10">
        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          <div className="lg:col-span-1 rounded-2xl border border-border/40 bg-card p-6">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold tracking-tight text-foreground">{sellerName}</h2>
                <p className="mt-1 text-sm font-semibold text-foreground/80">{sellerSubtitle}</p>
                <p className="mt-2 text-sm italic text-muted-foreground">{sellerActivity}</p>
              </div>
            </div>

            <div className="mt-6">
              <Button asChild className="w-full gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('openInMaps')}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  {t('openInMaps')}
                </a>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border/40 bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-foreground">{t('detailsTitle')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('detailsDesc')}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {phones.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 sm:col-span-2">
                  {phones.map((p) => (
                    <a
                      key={`${p.label}-${p.number}`}
                      href={`tel:${p.number}`}
                      aria-label={`${p.label}: ${p.number}`}
                      className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-foreground hover:bg-muted/40 transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                        <Phone className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-muted-foreground">{p.label}</div>
                        <div className="font-semibold tracking-tight text-foreground">{p.number}</div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/50 bg-background px-4 py-4 text-sm text-muted-foreground">
                  {t('noPhone')}
                </div>
              )}

              {hasServiceCharge ? (
                <a
                  href={`tel:${serviceChargeTel}`}
                  aria-label={`${t('serviceChargeLabel')}: ${serviceChargeTel}`}
                  className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-foreground hover:bg-muted/40 transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-muted-foreground">{t('serviceChargeLabel')}</div>
                    <div className="font-semibold tracking-tight text-foreground">{serviceCharge}</div>
                  </div>
                </a>
              ) : null}

              {email ? (
                <a
                  href={`mailto:${email}`}
                  aria-label={`${t('emailLabel')}: ${email}`}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-foreground hover:bg-muted/40 transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span className="text-muted-foreground">{t('emailLabel')}</span>
                  <span className="font-semibold break-all">{email}</span>
                </a>
              ) : null}

              {address ? (
                <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background px-4 py-3 sm:col-span-2">
                  <span
                    className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-muted-foreground">{t('addressLabel')}</div>
                    <div className="font-semibold text-foreground">{address}</div>
                  </div>
                </div>
              ) : null}

              {hours ? (
                <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background px-4 py-3 sm:col-span-2">
                  <span
                    className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <Clock className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-muted-foreground">{t('hoursLabel')}</div>
                    <div className="font-semibold text-foreground">{hours}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border/40 bg-card">
          <div className="px-6 py-5 border-b border-border/40">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('mapTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('mapDesc')}</p>
          </div>
          <div className="h-80 sm:h-[420px] md:h-[520px] w-full">
            <iframe
              title={t('mapTitle')}
              src={embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full"
              style={{ border: 0 }}
              allowFullScreen
            />
          </div>
        </div>

        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
        />
      </section>
    </div>
  )
}
