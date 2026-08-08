import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Truck } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function HomeHeroBanner({
  locale,
  tagline,
  title,
  titleAccent,
  description,
  ctaProducts,
  ctaPromo,
  deliveryTitle,
  deliveryDesc,
}: {
  locale: string
  tagline: string
  title: string
  titleAccent: string
  description: string
  ctaProducts: string
  ctaPromo: string
  deliveryTitle: string
  deliveryDesc: string
}) {
  const isRtl = locale === 'ar'

  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/hero/hero-1.jpg"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Readability scrim: strongest on the text side, fading across the image. */}
      <div
        className={`absolute inset-0 ${
          isRtl
            ? 'bg-linear-to-l from-black/85 via-black/60 to-black/25'
            : 'bg-linear-to-r from-black/85 via-black/60 to-black/25'
        }`}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-16 py-20 md:py-28 lg:py-32">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
            {tagline}
          </p>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white text-balance">
            {title}{' '}
            <span className="text-primary">{titleAccent}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base md:text-lg leading-relaxed text-white/75">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/${locale}/shop`}>
              <Button size="lg" className="gap-2 shadow-lg shadow-black/20">
                {ctaProducts}
                <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
            <Link href={`/${locale}/shop?sort=promo`}>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white/30 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
              >
                {ctaPromo}
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-3 text-white/80">
            <Truck className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm">
              <span className="font-semibold text-white">{deliveryTitle}</span>
              <span className="mx-1.5 text-white/40">·</span>
              {deliveryDesc}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
