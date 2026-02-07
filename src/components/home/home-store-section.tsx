'use client'

import { useMemo } from 'react'
import { Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'

import { cn } from '@/lib/utils'

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

  // Fallback: split on common separators and keep numeric parts
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

export function HomeStoreSection({
  className,
  title,
  description,
  openLabel,
  storeName = DEFAULT_SELLER.name,
  storeSubtitle = DEFAULT_SELLER.subtitle,
  storeActivity = DEFAULT_SELLER.activity,
  contactTitle,
  contactDesc,
  labelPhone,
  labelEmail,
  labelAddress,
  labelHours,
  unavailableLabel,
}: {
  className?: string
  title: string
  description: string
  openLabel: string
  storeName?: string
  storeSubtitle?: string
  storeActivity?: string
  contactTitle: string
  contactDesc: string
  labelPhone: string
  labelEmail: string
  labelAddress: string
  labelHours: string
  unavailableLabel: string
}) {
  const mapsUrl = (process.env.NEXT_PUBLIC_STORE_MAP_URL || DEFAULT_STORE_MAP_URL).trim()
  const query = (process.env.NEXT_PUBLIC_STORE_MAP_QUERY || DEFAULT_STORE_QUERY).trim()
  const embedUrl = useMemo(() => buildEmbedUrl(query), [query])

  const phonesRaw = (process.env.NEXT_PUBLIC_STORE_PHONES || process.env.NEXT_PUBLIC_STORE_PHONE || DEFAULT_SELLER.phones).trim()
  const phones = useMemo(() => parsePhones(phonesRaw), [phonesRaw])
  const email = (process.env.NEXT_PUBLIC_STORE_EMAIL || DEFAULT_SELLER.email).trim()
  const address = (process.env.NEXT_PUBLIC_STORE_ADDRESS || DEFAULT_SELLER.address).trim()
  const hours = (process.env.NEXT_PUBLIC_STORE_HOURS || '').trim()
  const hasContact = Boolean(phones.length > 0 || email || address || hours)

  return (
    <section className={cn('py-14', className)}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{title}</span>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <div className="h-full rounded-2xl border border-border/60 bg-card p-6 shadow-sm flex flex-col">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10" aria-hidden="true">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold tracking-tight text-foreground">{storeName}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{contactDesc}</p>
                {storeSubtitle ? (
                  <p className="mt-2 text-xs font-semibold tracking-wide text-foreground/80">{storeSubtitle}</p>
                ) : null}
                {storeActivity ? (
                  <p className="mt-1 text-xs italic text-muted-foreground">{storeActivity}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex-1">
              <div className="text-sm font-semibold text-foreground">{contactTitle}</div>

              {hasContact ? (
                <div className="mt-4 space-y-3 text-sm">
                  {phones.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {phones.map((p) => (
                        <a
                          key={`${p.label}-${p.number}`}
                          href={`tel:${p.number}`}
                          className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-foreground hover:bg-muted/40 transition-colors"
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
                  ) : null}

                  {email ? (
                    <a
                      href={`mailto:${email}`}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-foreground hover:bg-muted/40 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{labelEmail}</span>
                      <span className="font-semibold break-all">{email}</span>
                    </a>
                  ) : null}

                  {address ? (
                    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background px-4 py-3">
                      <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="text-muted-foreground">{labelAddress}</div>
                        <div className="font-semibold text-foreground">{address}</div>
                      </div>
                    </div>
                  ) : null}

                  {hours ? (
                    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background px-4 py-3">
                      <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="text-muted-foreground">{labelHours}</div>
                        <div className="font-semibold text-foreground">{hours}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground">{unavailableLabel}</div>
              )}
            </div>

            <div className="mt-6">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {openLabel}
              </a>
            </div>
          </div>

          <div className="h-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="h-[340px] lg:h-full w-full animate-in fade-in-0 duration-700">
              <iframe
                title={title}
                src={embedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full"
                style={{ border: 0 }}
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
