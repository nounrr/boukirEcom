import Image from 'next/image'
import { Award, CheckCircle2, MapPin } from 'lucide-react'
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
      'overflow-hidden border-y bg-background',
      'rounded-none',
      className,
    )}>
      <div className={cn('flex items-center gap-4', compact ? 'py-5' : 'py-6')}>
        <div className={cn(
          'relative shrink-0 overflow-hidden bg-muted',
          compact ? 'h-16 w-16 rounded-md' : 'h-24 w-24 rounded-md sm:h-28 sm:w-28',
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
              className="flex h-full w-full items-center justify-center bg-muted text-xl font-medium text-muted-foreground sm:text-2xl"
              role="img"
              aria-label={labels.noPhoto}
            >
              {getMaalemInitials(maalem.public_name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <Badge className="mb-2 gap-1 border-0 bg-transparent p-0 text-xs font-medium text-emerald-700 hover:bg-transparent dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {labels.verified}
          </Badge>
          <h2 className={cn('break-words font-medium', compact ? 'text-lg' : 'text-2xl')}>{maalem.public_name}</h2>
          {categoryName && (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {categoryName}
            </p>
          )}
        </div>
      </div>

      {(maalem.city || maalem.intervention_areas.length > 0 || maalem.experience_years != null) && (
        <div className={cn(
          'grid gap-3 border-t text-sm text-muted-foreground',
          compact ? 'py-4' : 'py-5 sm:grid-cols-2',
        )}>
          {maalem.city && (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span><span className="sr-only">{labels.location}: </span>{maalem.city}</span>
            </p>
          )}
          {maalem.experience_years != null && (
            <p className="flex items-start gap-2">
              <Award className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
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
