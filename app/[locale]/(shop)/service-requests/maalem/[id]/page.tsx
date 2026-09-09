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

  const maalem = await getPublicMaalem(id)
  if (!maalem) notFound()

  return (
    <ServiceRequestForm
      mode="selected_maalem"
      requestedMaalemId={maalem.id}
      maalem={maalem}
      serviceId={serviceId}
      backHref={`/${locale}/maalems/${maalem.id}`}
    />
  )
}
