import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, MapPin, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { resolvePublicMaalemPhoto } from '@/lib/service-requests'
import { serviceMaalemRequestHref } from '@/lib/service-catalog'
import type { CompatibleServiceMaalem } from '@/types/service-request'

export function CompatibleMaalemCard({ maalem, locale, serviceId, labels }: {
  maalem: CompatibleServiceMaalem
  locale: string
  serviceId: number
  labels: { verified: string; city: string; areas: string; missions: string; notice: string; profile: string; choose: string }
}) {
  const photo = resolvePublicMaalemPhoto(maalem.photo_url)
  const category = locale === 'ar' ? maalem.category.name_ar || maalem.category.name : maalem.category.name || maalem.category.name_ar
  return <article className="flex min-h-full flex-col border border-amber-200/80 bg-[#fffdf7] shadow-[0_18px_42px_-34px_rgba(66,48,17,0.55)] dark:border-amber-900/60 dark:bg-card">
    <div className="flex items-center gap-4 p-5">
      <div className="relative size-20 shrink-0 overflow-hidden bg-amber-100">
        {photo ? <Image src={photo} alt={maalem.public_name} fill sizes="80px" className="object-cover" /> : <div className="flex size-full items-center justify-center text-2xl font-bold text-amber-900" role="img" aria-label={maalem.public_name}>{maalem.public_name.slice(0, 2).toUpperCase()}</div>}
      </div>
      <div className="min-w-0"><p className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="size-4" aria-hidden="true" />{labels.verified}</p><h3 className="mt-1 truncate text-xl font-bold">{maalem.public_name}</h3><p className="mt-1 text-sm font-medium text-amber-800">{category}</p></div>
    </div>
    <div className="flex-1 space-y-2 border-t border-amber-200/70 bg-amber-50/45 px-5 py-4 text-sm text-muted-foreground">
      {maalem.city && <p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" /><span><span className="sr-only">{labels.city}: </span>{maalem.city}</span></p>}
      {maalem.intervention_areas.length > 0 && <p><strong className="text-foreground">{labels.areas}: </strong>{maalem.intervention_areas.join(' · ')}</p>}
      <p className="flex gap-2 font-medium text-foreground"><Wrench className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />{labels.missions}</p>
      <p className="text-xs leading-5">{labels.notice}</p>
    </div>
    <div className="grid grid-cols-2 gap-2 p-4">
      <Button asChild variant="outline" className="min-h-10 h-auto whitespace-normal"><Link href={`/${locale}/maalems/${maalem.id}`}>{labels.profile}</Link></Button>
      <Button asChild className="min-h-10 h-auto whitespace-normal"><Link href={serviceMaalemRequestHref(locale, maalem.id, serviceId)}>{labels.choose}</Link></Button>
    </div>
  </article>
}
