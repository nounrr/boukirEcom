import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, BadgeCheck, ShieldCheck, Truck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { HomeProductSections } from '@/components/home/home-product-sections'
import { normalizeLocale } from '@/i18n/locale'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)
  const tCommon = useTranslations('common')
  const tShop = useTranslations('shop')

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-background" />
        <div className="relative container mx-auto px-6 sm:px-8 lg:px-16 py-14 md:py-18">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              {tShop('tagline')}
            </p>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              {tCommon('home')}
              <span className="text-primary"> Boukir</span>
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground">
              Découvrez nos produits et trouvez rapidement ce qu’il vous faut grâce à la recherche en haut de page.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/${locale}/shop`}>
                <Button size="lg" className="gap-2">
                  {tCommon('products')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/${locale}/shop?sort=promo`}>
                <Button size="lg" variant="outline" className="gap-2">
                  {tShop('featuredTitle')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border/40 bg-card p-5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-3 font-semibold text-foreground">Livraison rapide</h3>
              <p className="mt-1 text-sm text-muted-foreground">Des options adaptées à votre région.</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card p-5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-3 font-semibold text-foreground">Paiement sécurisé</h3>
              <p className="mt-1 text-sm text-muted-foreground">Transactions protégées et fiables.</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card p-5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <BadgeCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-3 font-semibold text-foreground">Qualité & choix</h3>
              <p className="mt-1 text-sm text-muted-foreground">Une sélection pensée pour les pros.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product sections */}
      <HomeProductSections
        locale={locale}
        featuredTitle={tShop('featuredTitle')}
        featuredDesc={tShop('featuredDesc')}
        newArrivalsTitle={tShop('newArrivalsTitle')}
        newArrivalsDesc={tShop('newArrivalsDesc')}
      />
    </div>
  )
}
