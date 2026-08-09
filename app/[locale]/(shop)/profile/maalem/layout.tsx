import type { Metadata } from 'next'
import type React from 'react'

import { buildPageMetadata } from '@/lib/seo/metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    path: '/profile/maalem',
    title: locale === 'ar' ? 'طلب معلم مهني' : 'Candidature Maalem',
    description:
      locale === 'ar'
        ? 'أكمل ملفك المهني وأرسله للمراجعة.'
        : 'Complétez votre dossier professionnel Maalem et envoyez-le pour vérification.',
    indexable: false,
  })
}

export default function MaalemApplicationLayout({ children }: { children: React.ReactNode }) {
  return children
}
