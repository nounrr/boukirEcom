import { ImageIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import type { PublicService } from '@/types/service-request'

interface Props {
  service: PublicService
  locale: string
}

export function ServiceSummary({ service, locale }: Props) {
  const t = useTranslations('serviceRequests.form')
  const isArabic = locale === 'ar'
  const name = (isArabic ? service.nom_ar : service.nom) || service.nom
  const description = (isArabic ? service.description_ar : service.description) || service.description
  const imageUrl = toAbsoluteImageUrl(service.image_url)

  return (
    <section className="overflow-hidden rounded-md bg-muted/25">
      <div className="flex flex-col">
        <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="p-5" dir={isArabic ? 'rtl' : undefined}>
          <p className="text-xs font-medium text-muted-foreground">{t('serviceEyebrow')}</p>
          <h2 className="mt-2 text-xl font-medium leading-snug">{name}</h2>
          {description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{description}</p>}
          {service.categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {service.categories.map((category) => (
                <span key={category.id} className="border-s border-border ps-2 text-xs leading-5 text-muted-foreground">
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
