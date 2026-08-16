import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
  serviceId: number
  locale: string
  label: string
}

export function RequestServiceButton({ serviceId, locale, label }: Props) {
  return (
    <Button asChild>
      <Link href={`/${locale}/services/${serviceId}/request`}>{label}</Link>
    </Button>
  )
}
