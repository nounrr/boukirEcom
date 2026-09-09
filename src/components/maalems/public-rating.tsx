import { Star } from 'lucide-react'

export function PublicRating({ rating, count, locale, labels, showEmpty = true, compact = false }: {
  rating: number | null
  count: number
  locale: string
  labels: { rating: string; verified: string; empty: string }
  showEmpty?: boolean
  compact?: boolean
}) {
  if (rating == null || count <= 0) {
    return showEmpty ? <p className={`${compact ? 'text-xs' : 'text-sm'} leading-5 text-muted-foreground`}>{labels.empty}</p> : null
  }
  const value = Math.min(5, Math.max(1, rating))
  const formatted = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value)
  const accessible = labels.rating.replace('{rating}', formatted).replace('{count}', String(count))
  return <div className={`flex flex-wrap items-center ${compact ? 'gap-1.5 text-xs' : 'gap-2 text-sm'}`} role="img" aria-label={accessible}>
    <span className="inline-flex gap-0.5" aria-hidden="true">
      <Star className={`${compact ? 'size-3.5' : 'size-4'} fill-amber-500 text-amber-600 dark:fill-amber-400 dark:text-amber-400`} />
    </span>
    <strong className="font-medium tabular-nums text-foreground">{formatted}/5</strong>
    <span className="text-muted-foreground">· {count} {labels.verified}</span>
  </div>
}
