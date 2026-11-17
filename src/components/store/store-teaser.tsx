import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Camera } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { STORE_PHOTOS, STORE_VIDEOS } from "@/lib/store-media"
import { StoreVideoCard } from "./store-videos"
import { StoreSocials } from "./store-socials"

/** Accueil : aperçu du magasin (photos, vidéo, réseaux) et lien vers la page complète. */
export async function StoreTeaser({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "storePage" })
  const photos = [STORE_PHOTOS[0], STORE_PHOTOS[7], STORE_PHOTOS[10], STORE_PHOTOS[13]]
  const video = STORE_VIDEOS[0]

  return (
    <section className="py-20 lg:py-28" aria-labelledby="store-teaser-title">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="kicker flex items-center gap-3 !text-[var(--accent-text)]">
              <Camera className="size-4" aria-hidden="true" />{t("teaser.kicker")}
            </p>
            <h2 id="store-teaser-title" className="display-lg mt-4 max-w-[18ch] text-[2.1rem] sm:text-5xl">{t("teaser.title")}</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{t("teaser.description")}</p>
          </div>
          <Link href={`/${locale}/magasin`} className="group inline-flex h-12 items-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-ink">
            {t("teaser.cta")}
            <ArrowRight className="size-4 transition-[translate] duration-500 group-hover:translate-x-1 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-4">
          <StoreVideoCard video={video} label={t(`videos.labels.${video.key}`)} className="col-span-2 row-span-2" />
          {photos.map((photo, index) => (
            <Link
              key={photo.src}
              href={`/${locale}/magasin#galerie`}
              className="group relative overflow-hidden rounded-3xl bg-muted"
              aria-label={t("gallery.alt", { index: index + 1 })}
            >
              <Image src={photo.src} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-[scale] duration-[900ms] ease-hover group-hover:scale-105" />
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <StoreSocials locale={locale} compact />
        </div>
      </div>
    </section>
  )
}
