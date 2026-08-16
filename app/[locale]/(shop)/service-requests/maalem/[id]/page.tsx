import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ServiceRequestForm } from '@/components/service-requests/service-request-form'
import { getPublicMaalem } from '@/lib/service-requests'

export default async function SelectedMaalemRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ service_id?: string | string[] }>
}) {
  const [{ locale, id: rawId }, query] = await Promise.all([params, searchParams])
  const id = Number(rawId)
  if (!Number.isSafeInteger(id) || id <= 0) notFound()
  const rawServiceId = Array.isArray(query.service_id) ? query.service_id[0] : query.service_id
  const serviceId = rawServiceId ? Number(rawServiceId) : undefined
  if (serviceId !== undefined && (!Number.isSafeInteger(serviceId) || serviceId <= 0)) notFound()

  const [maalem, t] = await Promise.all([
    getPublicMaalem(id),
    getTranslations({ locale, namespace: 'serviceRequests' }),
  ])
  if (!maalem) notFound()

  return (
    <div className="bg-[#fbf8f0] dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href={`/${locale}/maalems/${maalem.id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          {t('form.backToProfile')}
        </Link>
        <ServiceRequestForm
          mode="selected_maalem"
          requestedMaalemId={maalem.id}
          maalem={maalem}
          serviceId={serviceId}
        />
      </div>
    </div>
  )
}
