'use client'

import { useMemo } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'

import { cn } from '@/lib/utils'

const DEFAULT_STORE_MAP_URL =
  'https://www.google.com/maps/place/BOUKIR+DIAMOND+CONSTUCTION+STORE/@35.7532036,-5.8421462,1453m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd0b87005196739b:0xfa8dc0aeae136e27!8m2!3d35.7532036!4d-5.8421462!16s%2Fg%2F11y45mc9yr?entry=ttu'
const DEFAULT_STORE_LAT = 35.7532036
const DEFAULT_STORE_LNG = -5.8421462
const DEFAULT_STORE_QUERY = 'BOUKIR DIAMOND CONSTUCTION STORE'

function parseNumber(value: string | undefined): number | null {
  if (!value) return null
  const num = Number.parseFloat(value)
  return Number.isFinite(num) ? num : null
}

function buildGoogleMapsUrl({ lat, lng, query }: { lat?: number | null; lng?: number | null; query?: string }) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
  }
  const fallbackQuery = query?.trim() ? query.trim() : 'Boukir'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`
}

function buildEmbedUrl({ lat, lng, query }: { lat?: number | null; lng?: number | null; query?: string }) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&output=embed`
  }
  const fallbackQuery = query?.trim() ? query.trim() : 'Boukir'
  return `https://www.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&output=embed`
}

export function FooterStoreMap({
  className,
  title,
  description,
  openLabel,
  unavailableLabel,
}: {
  className?: string
  title: string
  description: string
  openLabel: string
  unavailableLabel: string
}) {
  const directMapsUrl = process.env.NEXT_PUBLIC_STORE_MAP_URL?.trim() || DEFAULT_STORE_MAP_URL

  const lat = parseNumber(process.env.NEXT_PUBLIC_STORE_LAT) ?? DEFAULT_STORE_LAT
  const lng = parseNumber(process.env.NEXT_PUBLIC_STORE_LNG) ?? DEFAULT_STORE_LNG
  const query = process.env.NEXT_PUBLIC_STORE_MAP_QUERY ?? DEFAULT_STORE_QUERY

  const mapsUrl = useMemo(() => directMapsUrl || buildGoogleMapsUrl({ lat, lng, query }), [directMapsUrl, lat, lng, query])
  const embedUrl = useMemo(() => buildEmbedUrl({ lat, lng, query }), [lat, lng, query])

  const center = useMemo(() => {
    if (lat == null || lng == null) return null
    return { lat, lng }
  }, [lat, lng])

  return (
    <section className={cn('rounded-2xl border border-white/15 bg-white/5 p-6', className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 lg:max-w-[360px]">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10" aria-hidden="true">
              <MapPin className="h-5 w-5 text-white" />
            </span>
            <h3 className="text-base font-extrabold tracking-tight">{title}</h3>
          </div>
          <p className="mt-2 text-sm text-white/80">{description}</p>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 hover:border-white/25 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            {openLabel}
          </a>

          {!center ? <div className="mt-3 text-xs text-white/70">{unavailableLabel}</div> : null}
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 lg:flex-1">
          <iframe
            title={title}
            src={embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[260px] w-full"
            style={{ border: 0 }}
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}
