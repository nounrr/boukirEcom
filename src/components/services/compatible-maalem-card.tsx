import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, MapPin, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { resolvePublicMaalemPhoto } from '@/lib/service-requests'
import { serviceMaalemRequestHref } from '@/lib/service-catalog'
import type { CompatibleServiceMaalem } from '@/types/service-request'
import { PublicRating } from '@/components/maalems/public-rating'

export function CompatibleMaalemCard({ maalem, locale, serviceId, labels }: {
  maalem: CompatibleServiceMaalem
  locale: string
  serviceId: number
  labels: { verified: string; city: string; areas: string; missions: string; profile: string; choose: string; rating: string; verifiedReviews: string; noReviews: string }
}) {
  const photo = resolvePublicMaalemPhoto(maalem.photo_url)
  const category = locale === 'ar' ? maalem.category.name_ar || maalem.category.name : maalem.category.name || maalem.category.name_ar
  return <article className="flex min-h-full flex-col border-b border-border py-6">
    <div className="flex items-start gap-4">
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {photo ? <Image src={photo} alt={maalem.public_name} fill sizes="80px" className="object-cover transition motion-safe:duration-300 " /> : <div className="flex size-full items-center justify-center text-2xl font-medium text-muted-foreground" role="img" aria-label={maalem.public_name}>{maalem.public_name.slice(0, 2).toUpperCase()}</div>}
      </div>
      <div className="min-w-0"><p className="flex items-center gap-1 text-xs text-emerald-800 dark:text-emerald-400"><CheckCircle2 className="size-4" aria-hidden="true" />{labels.verified}</p><h3 className="mt-1 text-xl font-medium">{maalem.public_name}</h3><p className="mt-1 text-sm text-muted-foreground">{category}</p></div>
    </div>
    <div className="flex-1 space-y-3 py-5 text-sm leading-6 text-muted-foreground">
      {maalem.city && <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span><span className="sr-only">{labels.city}: </span>{maalem.city}</span></p>}
      {maalem.intervention_areas.length > 0 && <p><strong className="text-foreground">{labels.areas}: </strong>{maalem.intervention_areas.join(' · ')}</p>}
      <p className="flex gap-2 font-medium text-foreground"><Wrench className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />{labels.missions}</p>
      <PublicRating rating={maalem.average_rating} count={maalem.review_count} locale={locale} compact labels={{ rating: labels.rating, verified: labels.verifiedReviews, empty: labels.noReviews }} />
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button asChild variant="ghost" className="h-auto min-h-11 whitespace-normal px-0 text-muted-foreground hover:bg-transparent"><Link href={`/${locale}/maalems/${maalem.id}`}>{labels.profile}</Link></Button>
      <Button asChild variant="ghost" className="h-auto min-h-11 whitespace-normal px-0 text-emerald-800 hover:bg-transparent dark:text-emerald-400"><Link href={serviceMaalemRequestHref(locale, maalem.id, serviceId)}>{labels.choose}</Link></Button>
    </div>
  </article>
}
