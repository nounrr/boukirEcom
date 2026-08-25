import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Award, CheckCircle2, MapPin, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMaalemInitials } from '@/components/service-requests/maalem-public-summary'
import { resolvePublicMaalemPhoto } from '@/lib/service-requests'
import type { PublicMaalemSummary as Maalem } from '@/types/service-request'
import { PublicRating } from '@/components/maalems/public-rating'

export function MaalemDirectoryCard({ maalem, locale, stats, labels }: { maalem: Maalem; locale: string; stats: { closed_interventions: number; average_rating: number | null; review_count: number }; labels: Record<string, string> }) {
  const photoUrl = resolvePublicMaalemPhoto(maalem.photo_url)
  const categoryName = locale === 'ar'
    ? maalem.category.name_ar || maalem.category.name
    : maalem.category.name || maalem.category.name_ar
  const profileHref = `/${locale}/maalems/${maalem.id}`

  return (
    <article className="group relative flex min-h-full w-full flex-col overflow-hidden rounded-[14px] border border-stone-200/90 bg-card shadow-[0_16px_40px_-34px_rgba(41,37,32,.55)] transition motion-safe:duration-300 motion-safe:hover:-translate-y-0.5 hover:border-amber-400/60 hover:shadow-[0_20px_45px_-34px_rgba(41,37,32,.7)] dark:border-border">
      {/* Photo — 4/3 banner keeps the tile short in a dense grid. */}
      <Link href={profileHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-amber-50">

          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={maalem.public_name}
              fill
              sizes="(min-width: 1024px) 260px, (min-width: 640px) 40vw, 90vw"
              className="object-cover transition motion-safe:duration-500 motion-safe:group-hover:scale-[1.035]"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center bg-amber-100 text-4xl font-bold text-amber-950"
              role="img"
              aria-label={labels.noPhoto}
            >
              {getMaalemInitials(maalem.public_name)}
            </div>
          )}

          {/* Verified marker as a corner chip: costs no vertical space in the body. */}
          <span className="absolute bottom-3 start-3 z-20 flex items-center gap-1.5 rounded-[6px] bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm dark:bg-stone-950/90 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
            {labels.verified}
          </span>
        </div>
      </Link>

      {/* Content — mirrors the product tile rhythm: eyebrow, title, meta badges. */}
      <div className="flex flex-1 flex-col p-5">
        <Link href={profileHref} className="block">
          {categoryName && (
            <p className="mb-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
              {categoryName}
            </p>
          )}

          <h3 className="text-xl font-bold leading-tight tracking-tight">
            {maalem.public_name}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {maalem.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-amber-700" aria-hidden="true" />
                <span className="max-w-24 truncate">{maalem.city}</span>
              </span>
            )}
            {maalem.experience_years != null && (
              <span className="inline-flex items-center gap-1.5">
                <Award className="size-4 text-amber-700" aria-hidden="true" />
                <span>{labels.experience.replace('{years}', String(maalem.experience_years))}</span>
              </span>
            )}
          </div>

          {/* Verified interventions sit where the product price sits: the headline figure.
              The label keeps its own {count} placeholder so word order stays correct in every locale. */}
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold">
            <Wrench className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />
            {labels.interventions.replace('{count}', String(stats.closed_interventions))}
          </p>

          <div className="mt-3">
            <PublicRating rating={stats.average_rating} count={stats.review_count} locale={locale} compact labels={{ rating: labels.ratingLabel, verified: labels.verifiedReviews, empty: labels.noReviews }} />
          </div>

          {maalem.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {maalem.skills.slice(0, 2).map((skill) => (
                <span key={skill} className="rounded-[4px] bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-200">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </Link>

        {/* Kept as a single truncated line: the notice must stay on the card,
            the full wording remains on the profile page. */}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
          <Button asChild variant="outline" className="min-h-11 rounded-[6px]">
            <Link href={profileHref}>{labels.profile}</Link>
          </Button>
          <Button asChild className="min-h-11 rounded-[6px]">
            <Link href={`/${locale}/service-requests/maalem/${maalem.id}`}>
              {labels.request}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
