import Link from 'next/link'
import { CheckCircle2, MapPin, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { resolvePublicMaalemPhoto } from '@/lib/service-requests'
import { serviceMaalemRequestHref } from '@/lib/service-catalog'
import type { CompatibleServiceMaalem } from '@/types/service-request'
import { PublicRating } from '@/components/maalems/public-rating'
import { PublicMaalemPortrait } from '@/components/services/public-maalem-portrait'

export function CompatibleMaalemCard({ maalem, locale, serviceId, labels }: {
  maalem: CompatibleServiceMaalem
  locale: string
  serviceId: number
  labels: { verified: string; city: string; areas: string; missions: string; profile: string; choose: string; rating: string; verifiedReviews: string; noReviews: string }
}) {
  const photo = resolvePublicMaalemPhoto(maalem.photo_url)
  const category = locale === 'ar' ? maalem.category.name_ar || maalem.category.name : maalem.category.name || maalem.category.name_ar
  return <article className="flex min-h-full min-w-0 flex-col rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-[0_14px_30px_-26px_rgba(4,90,64,.55)] transition-colors duration-150 hover:border-emerald-400 focus-within:border-emerald-400 motion-reduce:transition-none dark:border-emerald-900 dark:bg-card dark:hover:border-emerald-500">
    <div className="flex min-w-0 items-start gap-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-emerald-950 max-[380px]:size-16">
        <PublicMaalemPortrait src={photo} name={maalem.public_name} sizes="80px" />
      </div>
      <div className="min-w-0"><p className="flex flex-wrap items-center gap-1 text-xs text-emerald-800 dark:text-emerald-400"><CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />{labels.verified}</p><h3 className="mt-1 break-words text-xl font-medium">{maalem.public_name}</h3><p className="mt-1 break-words text-sm text-muted-foreground">{category}</p></div>
    </div>
    <div className="flex-1 space-y-3 py-5 text-sm leading-6 text-muted-foreground">
      {maalem.city && <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden="true" /><span><span className="sr-only">{labels.city}: </span>{maalem.city}</span></p>}
      {maalem.intervention_areas.length > 0 && <p><strong className="text-foreground">{labels.areas}: </strong>{maalem.intervention_areas.join(' · ')}</p>}
      <p className="flex gap-2 rounded-xl bg-emerald-50 px-3 py-2 font-medium text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100"><Wrench className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />{labels.missions}</p>
      <PublicRating rating={maalem.average_rating} count={maalem.review_count} locale={locale} compact labels={{ rating: labels.rating, verified: labels.verifiedReviews, empty: labels.noReviews }} />
    </div>
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 dark:border-white/10">
      <Button asChild variant="ghost" className="h-auto min-h-11 whitespace-normal px-0 text-foreground hover:bg-transparent hover:underline"><Link href={`/${locale}/maalems/${maalem.id}`}>{labels.profile}</Link></Button>
      <Button asChild className="h-auto min-h-11 w-full min-w-0 max-w-full break-words whitespace-normal rounded-full bg-emerald-900 px-5 py-2 text-center text-white hover:bg-emerald-800 sm:w-auto dark:bg-emerald-700 dark:hover:bg-emerald-600"><Link href={serviceMaalemRequestHref(locale, maalem.id, serviceId)}>{labels.choose}</Link></Button>
    </div>
  </article>
}
