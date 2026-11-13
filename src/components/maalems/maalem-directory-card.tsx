import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowRight, Award, BadgeCheck, MapPin, Star, Wrench } from 'lucide-react'
import { getMaalemInitials } from '@/components/service-requests/maalem-public-summary'
import { resolvePublicMaalemPhoto } from '@/lib/service-requests'
import type { PublicMaalemSummary as Maalem } from '@/types/service-request'
import { MaalemCardPortrait } from './maalem-card-portrait'

/**
 * Directory profile card — photo stage with category / verified / rating
 * overlays, real statistics, and the two existing actions (profile, request).
 * Server rendered; hover is pure CSS.
 */
export function MaalemDirectoryCard({ maalem, locale, stats, labels, index = 0 }: {
  maalem: Maalem
  locale: string
  stats: { closed_interventions: number; average_rating: number | null; review_count: number }
  labels: Record<string, string>
  index?: number
}) {
  const photoUrl = resolvePublicMaalemPhoto(maalem.photo_url)
  const categoryName = locale === 'ar' ? maalem.category.name_ar || maalem.category.name : maalem.category.name || maalem.category.name_ar
  const profileHref = `/${locale}/maalems/${maalem.id}`
  const hasRating = stats.average_rating != null && stats.review_count > 0
  const ratingValue = hasRating ? new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.min(5, Math.max(1, stats.average_rating as number))) : null
  const ratingLabel = hasRating ? labels.ratingLabel.replace('{rating}', ratingValue as string).replace('{count}', String(stats.review_count)) : labels.noReviews
  const blurb = maalem.professional_summary?.trim() || (maalem.skills.length > 0 ? maalem.skills.join(' · ') : null)

  return <article
    className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.4rem] border border-border bg-card transition-[transform,box-shadow,border-color] duration-[800ms] ease-[var(--ease-slow)] focus-within:border-[rgba(242,159,4,0.6)] hover:-translate-y-1 hover:border-[rgba(242,159,4,0.6)] hover:shadow-[0_30px_60px_-34px_rgba(13,13,13,0.5)]"
    data-reveal
    style={{ ['--reveal-delay' as string]: `${(index % 4) * 80}ms` } as CSSProperties}
  >
    <Link href={profileHref} className="relative block aspect-[4/3.5] overflow-hidden bg-muted" aria-label={`${labels.profile} — ${maalem.public_name}`}>
      <MaalemCardPortrait src={photoUrl} name={maalem.public_name} initials={getMaalemInitials(maalem.public_name)} fallbackLabel={labels.noPhoto} />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/5 to-transparent" aria-hidden="true" />
      <span className="absolute start-3 top-3 max-w-[72%] truncate rounded-full bg-ink/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md rtl:tracking-normal">{categoryName}</span>
      {maalem.is_verified && <span className="absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-gold text-ink shadow-lg" aria-hidden="true"><BadgeCheck className="size-4" /></span>}
      <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white">
        {maalem.city ? <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-white/90"><MapPin className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{maalem.city}</span></span> : <span />}
        {hasRating && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink" aria-hidden="true"><Star className="size-3.5 fill-amber-500 text-amber-500" />{ratingValue}</span>}
      </span>
      <span className="absolute inset-0 rounded-t-[1.4rem] ring-0 ring-inset ring-brand-orange/0 transition group-hover:ring-1 group-hover:ring-brand-orange/30" aria-hidden="true" />
    </Link>

    <div className="flex flex-1 flex-col p-4 sm:p-5">
      <h3 className="flex items-center gap-1.5 text-lg font-bold leading-tight tracking-tight">
        <Link href={profileHref} className="min-w-0 break-words transition-colors hover:text-accent-text">{maalem.public_name}</Link>
        {maalem.is_verified && <BadgeCheck className="size-[18px] shrink-0 text-emerald-600 dark:text-emerald-400" role="img" aria-label={labels.verified} />}
      </h3>
      {blurb && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{blurb}</p>}
      <ul className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-medium text-foreground/80">
        <li className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1" title={ratingLabel}><Star className="size-3.5 shrink-0 text-accent-text" aria-hidden="true" />{hasRating ? `${ratingValue}/5 · ${stats.review_count} ${labels.verifiedReviews}` : labels.noReviews}</li>
        <li className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Wrench className="size-3.5 shrink-0 text-accent-text" aria-hidden="true" />{labels.interventions.replace('{count}', String(stats.closed_interventions))}</li>
        {maalem.experience_years != null && <li className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Award className="size-3.5 shrink-0 text-accent-text" aria-hidden="true" />{labels.experience.replace('{years}', String(maalem.experience_years))}</li>}
      </ul>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
        <Link href={profileHref} className="inline-flex h-10 min-w-0 items-center justify-center rounded-full border border-border px-3 text-center text-xs font-semibold transition-colors hover:border-foreground/40 hover:bg-muted">{labels.profile}</Link>
        <Link href={`/${locale}/service-requests/maalem/${maalem.id}`} className="group/btn inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-full bg-gold px-3 text-center text-xs font-semibold text-ink transition-[filter] hover:brightness-105">
          {labels.request}<ArrowRight className="size-3.5 shrink-0 transition-transform group-hover/btn:translate-x-0.5 rtl:rotate-180 rtl:group-hover/btn:-translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  </article>
}
