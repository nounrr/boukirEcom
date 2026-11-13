"use client"

import { ArrowRight, Clock, MapPin, Navigation, Phone } from "lucide-react"
import { useTranslations } from "next-intl"
import { CONTACT } from "@/lib/contact"

/** Store location — verified address, phone and hours with the live map. */
export function FlagshipStore() {
  const t = useTranslations("footer")
  const tx = useTranslations("xp.home.store")
  const query = (process.env.NEXT_PUBLIC_STORE_MAP_QUERY || "BOUKIR DIAMOND CONSTUCTION STORE").trim()

  return (
    <section className="bg-surface-2/60 py-20 lg:py-28" aria-labelledby="store-title">
      <div className="mx-auto grid max-w-[1440px] gap-6 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
        <div className="flex flex-col justify-between rounded-[2rem] bg-ink p-8 text-white sm:p-10" data-reveal>
          <div>
            <p className="kicker !text-brand-yellow">{tx("kicker")}</p>
            <h2 id="store-title" className="display-lg mt-4 text-4xl">
              Boukir Diamond
              <span className="block text-white/40">Construction Store</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/60">{t("storeLocationDesc")}</p>
          </div>
          <dl className="mt-10 space-y-5 text-sm">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden="true" />
              <div><dt className="text-xs text-white/45">{t("storeContactAddress")}</dt><dd className="mt-1 font-medium leading-relaxed">{CONTACT.address}</dd></div>
            </div>
            <div className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden="true" />
              <div><dt className="text-xs text-white/45">{t("storeContactPhone")}</dt><dd className="mt-1 font-medium" dir="ltr"><a href={CONTACT.phoneHref} className="hover:text-brand-yellow">{CONTACT.phoneDisplay}</a></dd></div>
            </div>
            {CONTACT.hours ? (
              <div className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand-yellow" aria-hidden="true" />
                <div><dt className="text-xs text-white/45">{t("storeContactHours")}</dt><dd className="mt-1 font-medium">{CONTACT.hours}</dd></div>
              </div>
            ) : null}
          </dl>
          <a href={CONTACT.mapUrl} target="_blank" rel="noopener noreferrer" className="group mt-10 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-ink">
            {t("openInMaps")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" aria-hidden="true" />
          </a>
        </div>
        <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-border bg-muted" data-reveal="scale">
          <iframe
            title={`${t("storeLocationTitle")} — Boukir Diamond`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 size-full border-0 dark:[filter:invert(0.9)_hue-rotate(180deg)_saturate(0.6)]"
            allowFullScreen
          />
          <a href={CONTACT.mapUrl} target="_blank" rel="noopener noreferrer" className="absolute end-5 top-5 inline-flex items-center gap-2 rounded-full bg-background/95 px-4 py-2.5 text-sm font-semibold shadow-premium backdrop-blur">
            {t("openInMaps")}
            <Navigation className="size-4 text-accent-text rtl:-scale-x-100" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
