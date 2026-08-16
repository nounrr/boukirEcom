import Image from 'next/image'
import { Award, BriefcaseBusiness, CheckCircle2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { resolvePublicMaalemPhoto } from '@/lib/service-requests'
import { cn } from '@/lib/utils'
import type { PublicMaalemSummary } from '@/types/service-request'

interface MaalemPublicSummaryProps {
  maalem: PublicMaalemSummary
  locale: string
  compact?: boolean
  className?: string
  labels: {
    verified: string
    location: string
    areas: string
    experience: (years: number) => string
    noPhoto: string
  }
}

export function getMaalemInitials(publicName: string): string {
  return publicName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join('') || 'M'
}

export function MaalemPublicSummary({
  maalem,
  locale,
  compact = false,
  className,
  labels,
}: MaalemPublicSummaryProps) {
  const photoUrl = resolvePublicMaalemPhoto(maalem.photo_url)
  const categoryName = locale === 'ar'
    ? maalem.category.name_ar || maalem.category.name
    : maalem.category.name || maalem.category.name_ar

  return (
    <article className={cn(
      'overflow-hidden border border-amber-200/80 bg-[#fffdf7] shadow-[0_18px_45px_-34px_rgba(66,48,17,0.5)] dark:border-amber-900/60 dark:bg-card',
      compact ? 'rounded-xl' : 'rounded-2xl',
      className,
    )}>
      <div className={cn('flex items-center gap-4', compact ? 'p-4' : 'p-5 sm:p-6')}>
        <div className={cn(
          'relative shrink-0 overflow-hidden border-2 border-white bg-amber-100 shadow-md dark:border-zinc-800 dark:bg-amber-950',
          compact ? 'h-16 w-16 rounded-xl' : 'h-24 w-24 rounded-2xl sm:h-28 sm:w-28',
        )}>
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={maalem.public_name}
              fill
              sizes={compact ? '64px' : '(min-width: 640px) 112px, 96px'}
              className="object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-amber-300 text-xl font-bold text-amber-950 sm:text-2xl"
              role="img"
              aria-label={labels.noPhoto}
            >
              {getMaalemInitials(maalem.public_name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <Badge className="mb-2 gap-1 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {labels.verified}
          </Badge>
          <h2 className={cn('truncate font-bold tracking-tight', compact ? 'text-lg' : 'text-2xl')}>{maalem.public_name}</h2>
          {categoryName && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
              <BriefcaseBusiness className="h-4 w-4 shrink-0" aria-hidden="true" />
              {categoryName}
            </p>
          )}
        </div>
      </div>

      {(maalem.city || maalem.intervention_areas.length > 0 || maalem.experience_years != null) && (
        <div className={cn(
          'grid gap-2 border-t border-amber-200/70 bg-amber-50/60 text-sm text-muted-foreground dark:border-amber-900/60 dark:bg-amber-950/20',
          compact ? 'px-4 py-3' : 'px-5 py-4 sm:grid-cols-2 sm:px-6',
        )}>
          {maalem.city && (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              <span><span className="sr-only">{labels.location}: </span>{maalem.city}</span>
            </p>
          )}
          {maalem.experience_years != null && (
            <p className="flex items-start gap-2">
              <Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              {labels.experience(maalem.experience_years)}
            </p>
          )}
          {!compact && maalem.intervention_areas.length > 0 && (
            <p className="sm:col-span-2">
              <span className="font-medium text-foreground">{labels.areas}: </span>
              {maalem.intervention_areas.join(' · ')}
            </p>
          )}
        </div>
      )}
    </article>
  )
}
