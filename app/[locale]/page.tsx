import { ProfessionalHome } from '@/components/home/professional/professional-home'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { normalizeLocale } from '@/i18n/locale'

export default async function HomePage({
  params,
}: {
    params: Promise<{ locale?: string }>
}) {
  const { locale: localeParam } = await params
  const locale = normalizeLocale(localeParam)

  return (
    <>
      <Header />
      <main className="overflow-x-clip">
        <ProfessionalHome locale={locale} />
      </main>
      <div className="md:hidden">
        <Footer variant="compact" className="mt-0" />
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </>
  )
}
