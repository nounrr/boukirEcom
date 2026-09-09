import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
  serviceId: number
  locale: string
  label: string
}

export function RequestServiceButton({ serviceId, locale, label }: Props) {
  return (
    <Button asChild className="min-h-11 rounded-md bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700">
      <Link href={`/${locale}/services/${serviceId}/request`}>{label}</Link>
    </Button>
  )
}
