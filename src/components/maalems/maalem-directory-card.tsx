import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, MapPin, Award, Wrench } from 'lucide-react'
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
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-900/10 bg-card p-5 shadow-[0_10px_28px_-18px_rgba(83,60,19,.32)] transition-shadow hover:shadow-[0_18px_40px_-20px_rgba(83,60,19,.38)] sm:p-6 dark:border-border">
      <div className="flex items-start gap-4 sm:gap-5">
        <Link href={profileHref} className="relative block h-32 w-24 shrink-0 overflow-hidden rounded-xl border border-amber-200/60 bg-amber-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:h-40 sm:w-32">
          {photoUrl ? <Image src={photoUrl} alt={maalem.public_name} fill sizes="128px" className="object-cover" /> : <div className="flex size-full items-center justify-center text-3xl font-semibold text-amber-900" role="img" aria-label={labels.noPhoto}>{getMaalemInitials(maalem.public_name)}</div>}
        </Link>
        <div className="min-w-0 flex-1">
          {categoryName && <p className="w-fit rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">{categoryName}</p>}
          <h3 className="mt-1 text-xl font-semibold leading-snug sm:text-2xl"><Link href={profileHref} className="rounded-sm outline-none hover:underline hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-emerald-700">{maalem.public_name}</Link></h3>
          <p className="mt-2 flex w-fit items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"><CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />{labels.verified}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {maalem.city && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-amber-600" aria-hidden="true" />{maalem.city}</span>}
            {maalem.experience_years != null && <span className="inline-flex items-center gap-1.5"><Award className="size-4 text-amber-600" aria-hidden="true" />{labels.experience.replace('{years}', String(maalem.experience_years))}</span>}
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300"><Wrench className="size-4 shrink-0" aria-hidden="true" />{labels.interventions.replace('{count}', String(stats.closed_interventions))}</p>
        </div>
      </div>
      <div className="mt-5 rounded-lg bg-amber-50/70 px-3 py-3 dark:bg-amber-950/20"><PublicRating rating={stats.average_rating} count={stats.review_count} locale={locale} compact labels={{ rating: labels.ratingLabel, verified: labels.verifiedReviews, empty: labels.noReviews }} /></div>
      {maalem.skills.length > 0 && <p className="mt-3 text-xs leading-5 text-muted-foreground">{maalem.skills.slice(0, 2).join(' · ')}</p>}
      <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
        <Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal rounded-lg px-3 text-emerald-900 dark:text-emerald-300"><Link href={profileHref}>{labels.profile}</Link></Button>
        <Button asChild className="h-auto min-h-11 whitespace-normal rounded-lg px-3 bg-amber-400 text-emerald-950 hover:bg-amber-300 dark:bg-amber-400 dark:text-emerald-950 dark:hover:bg-amber-300"><Link href={`/${locale}/service-requests/maalem/${maalem.id}`}>{labels.request}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link></Button>
      </div>
    </article>
  )
}
