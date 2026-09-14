import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Award, BadgeCheck, MapPin, Star, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMaalemInitials } from '@/components/service-requests/maalem-public-summary'
import { resolvePublicMaalemPhoto } from '@/lib/service-requests'
import type { PublicMaalemSummary as Maalem } from '@/types/service-request'

/** Statistique compacte : icone + valeur, le libelle complet reste lisible et accessible. */
function Stat({ icon, value, label, tone = 'muted' }: {
  icon: React.ReactNode
  value: string
  label: string
  tone?: 'muted' | 'amber'
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"
      role="img"
      aria-label={label}
      title={label}
    >
      <span className={tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'} aria-hidden="true">
        {icon}
      </span>
      <strong className="font-semibold tabular-nums text-foreground/80">{value}</strong>
    </span>
  )
}

export function MaalemDirectoryCard({ maalem, locale, stats, labels }: {
  maalem: Maalem
  locale: string
  stats: { closed_interventions: number; average_rating: number | null; review_count: number }
  labels: Record<string, string>
}) {
  const photoUrl = resolvePublicMaalemPhoto(maalem.photo_url)
  const categoryName = locale === 'ar'
    ? maalem.category.name_ar || maalem.category.name
    : maalem.category.name || maalem.category.name_ar
  const profileHref = `/${locale}/maalems/${maalem.id}`

  const hasRating = stats.average_rating != null && stats.review_count > 0
  const ratingValue = hasRating
    ? new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      .format(Math.min(5, Math.max(1, stats.average_rating as number)))
    : null
  const ratingLabel = hasRating
    ? labels.ratingLabel.replace('{rating}', ratingValue as string).replace('{count}', String(stats.review_count))
    : labels.noReviews

  // Le resume professionnel est la seule prose du profil ; a defaut, les competences.
  const blurb = maalem.professional_summary?.trim() || (maalem.skills.length > 0 ? maalem.skills.join(' · ') : null)

  const starClass = hasRating
    ? 'size-3.5 fill-amber-500 text-amber-600 dark:fill-amber-400 dark:text-amber-400'
    : 'size-3.5'

  return (
    <article
      className="group relative flex min-w-0 flex-col rounded-[26px] border border-black/[0.06] bg-card p-3
        shadow-[0_6px_20px_-14px_rgba(16,24,40,.28)]
        transition-[transform,box-shadow,border-color] duration-300 ease-out
        hover:-translate-y-1 hover:border-black/10 hover:shadow-[0_28px_52px_-24px_rgba(16,24,40,.45)]
        focus-within:-translate-y-1 focus-within:border-black/10 focus-within:shadow-[0_28px_52px_-24px_rgba(16,24,40,.45)]
        motion-reduce:transform-none motion-reduce:transition-none
        dark:border-white/10 dark:shadow-[0_6px_20px_-14px_rgba(0,0,0,.6)]
        dark:hover:border-white/20 dark:hover:shadow-[0_28px_52px_-24px_rgba(0,0,0,.75)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-amber-100 dark:bg-amber-950/40">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={maalem.public_name}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center text-4xl font-semibold text-amber-900 dark:text-amber-300"
            role="img"
            aria-label={labels.noPhoto}
          >
            {getMaalemInitials(maalem.public_name)}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5">
          {categoryName && (
            <span className="max-w-full truncate rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-950 shadow-sm backdrop-blur-sm dark:bg-emerald-950/85 dark:text-amber-200">
              {categoryName}
            </span>
          )}
          {maalem.city && (
            <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-black/45 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              {maalem.city}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-1 pt-4 sm:px-3">
        <h3 className="flex items-start gap-1.5 text-[17px] font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-emerald-900 dark:group-hover:text-emerald-300 sm:text-lg">
          <Link
            href={profileHref}
            className="min-w-0 rounded-sm outline-none hover:underline hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            {maalem.public_name}
          </Link>
          <BadgeCheck
            className="mt-0.5 size-[18px] shrink-0 fill-emerald-600 text-card dark:fill-emerald-500 dark:text-card"
            role="img"
            aria-label={labels.verified}
          />
        </h3>

        {blurb && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground transition-colors duration-300 group-hover:text-foreground/70">
            {blurb}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Stat
            icon={<Star className={starClass} />}
            value={hasRating ? `${ratingValue} (${stats.review_count})` : '—'}
            label={ratingLabel}
            tone="amber"
          />
          <Stat
            icon={<Wrench className="size-3.5" />}
            value={String(stats.closed_interventions)}
            label={labels.interventions.replace('{count}', String(stats.closed_interventions))}
          />
          {maalem.experience_years != null && (
            <Stat
              icon={<Award className="size-3.5" />}
              value={String(maalem.experience_years)}
              label={labels.experience.replace('{years}', String(maalem.experience_years))}
              tone="amber"
            />
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-full border-emerald-900/15 px-3 text-emerald-900 transition-all duration-300 group-hover:border-emerald-900/30 dark:border-border dark:text-emerald-300"
          >
            <Link href={profileHref}>{labels.profile}</Link>
          </Button>
          <Button
            asChild
            className="h-10 rounded-full bg-amber-400 px-3 text-emerald-950 shadow-none transition-all duration-300
              hover:bg-amber-300 hover:shadow-[0_10px_20px_-10px_rgba(180,120,10,.7)]
              group-hover:bg-amber-300
              dark:bg-amber-400 dark:text-emerald-950 dark:hover:bg-amber-300"
          >
            <Link href={`/${locale}/service-requests/maalem/${maalem.id}`}>
              {labels.request}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
