import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { buildPageMetadata } from '@/lib/seo/metadata'

const workspaceMetadata: Record<string, { title: string; description: string }> = {
  fr: { title: 'Mon espace maâlem', description: 'Vos missions, votre planning et le suivi de vos interventions.' },
  ar: { title: 'فضائي كمعلم', description: 'مهامك ومواعيدك وتتبع تدخلاتك.' },
  en: { title: 'My maâlem workspace', description: 'Your missions, schedule and intervention updates.' },
  zh: { title: '我的师傅工作区', description: '您的任务、日程和服务进度。' },
}

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({ locale, path: '/profile/maalem/missions', ...(workspaceMetadata[locale || 'fr'] || workspaceMetadata.fr), indexable: false })
}

export default function MaalemWorkspaceLayout({ children }: { children: ReactNode }) {
  return children
}
