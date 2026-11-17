import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { AllCategoriesExplorer } from '@/components/categories/all-categories-explorer'
import { normalizeLocale } from '@/i18n/locale'
import { API_CONFIG } from '@/lib/api-config'
import { buildPageMetadata } from '@/lib/seo/metadata'
import type { Category } from '@/types/category'

// Le catalogue change peu : rendu côté serveur (référencement) et rafraîchi toutes les 5 minutes.
export const revalidate = 300

async function loadCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`, {
      headers: { Platform: 'web' },
      next: { revalidate: 300 },
    })
    if (!response.ok) return []
    const data: unknown = await response.json()
    return Array.isArray(data) ? (data as Category[]) : []
  } catch {
    // Le composant client recharge la liste si le serveur n'a pas pu la lire.
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = normalizeLocale((await params).locale)
  const t = await getTranslations({ locale, namespace: 'categoriesPage' })
  return buildPageMetadata({
    locale,
    title: t('metadata.title'),
    description: t('metadata.description'),
    path: '/categories',
  })
}

export default async function AllCategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  await params
  const categories = await loadCategories()
  return <AllCategoriesExplorer initialCategories={categories} />
}
