import { ProfessionalCatalog } from './professional-catalog'
import { ProfessionalHero, ProfessionalJourneys } from './professional-hero'
import { ProfessionalStore } from './professional-store'

export function ProfessionalHome({ locale }: { locale: string }) {
  return (
    <>
      <ProfessionalHero locale={locale} />
      <ProfessionalJourneys locale={locale} />
      <ProfessionalCatalog locale={locale} />
      <ProfessionalStore locale={locale} />
    </>
  )
}
