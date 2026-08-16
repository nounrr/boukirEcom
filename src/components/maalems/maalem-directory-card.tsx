import Link from 'next/link'
import { ArrowRight, Wrench } from 'lucide-react'
import { MaalemPublicSummary } from '@/components/service-requests/maalem-public-summary'
import { Button } from '@/components/ui/button'
import type { PublicMaalemSummary as Maalem } from '@/types/service-request'

export function MaalemDirectoryCard({ maalem, locale, stats, labels }: { maalem: Maalem; locale: string; stats: { closed_interventions: number }; labels: Record<string, string> }) {
  return <article className="flex min-h-full flex-col border border-amber-200 bg-[#fffdf7] shadow-[0_18px_42px_-34px_rgba(66,48,17,.55)] dark:bg-card"><MaalemPublicSummary maalem={maalem} locale={locale} compact labels={{ verified: labels.verified, location: labels.city, areas: labels.areas, experience: (years) => labels.experience.replace('{years}', String(years)), noPhoto: labels.noPhoto }} /><div className="flex-1 px-5 py-4"><div className="flex flex-wrap gap-2">{maalem.skills.slice(0,3).map((skill) => <span key={skill} className="border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium">{skill}</span>)}</div><p className="mt-4 flex items-center gap-2 text-sm font-semibold"><Wrench className="size-4 text-emerald-700" />{labels.interventions.replace('{count}', String(stats.closed_interventions))}</p><p className="mt-2 text-xs text-muted-foreground">{labels.declared}</p></div><div className="grid grid-cols-2 gap-2 p-4"><Button asChild variant="outline"><Link href={`/${locale}/maalems/${maalem.id}`}>{labels.profile}</Link></Button><Button asChild><Link href={`/${locale}/service-requests/maalem/${maalem.id}`}>{labels.request}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button></div></article>
}
