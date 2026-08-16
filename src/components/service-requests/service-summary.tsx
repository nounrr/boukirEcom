import { ImageIcon } from 'lucide-react'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import type { PublicService } from '@/types/service-request'

interface Props {
  service: PublicService
  locale: string
}

export function ServiceSummary({ service, locale }: Props) {
  const isArabic = locale === 'ar'
  const name = (isArabic ? service.nom_ar : service.nom) || service.nom
  const description = (isArabic ? service.description_ar : service.description) || service.description
  const imageUrl = toAbsoluteImageUrl(service.image_url)

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="grid sm:grid-cols-[180px_1fr]">
        <div className="flex min-h-40 items-center justify-center bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full max-h-52 w-full object-cover" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="p-5" dir={isArabic ? 'rtl' : undefined}>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Service sélectionné</p>
          <h2 className="mt-2 text-xl font-bold">{name}</h2>
          {description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{description}</p>}
          {service.categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {service.categories.map((category) => (
                <span key={category.id} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {(isArabic ? category.nom_ar : category.nom) || category.nom}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
