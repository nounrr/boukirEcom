'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { Facebook, Instagram, Youtube, Truck, CreditCard, ShieldCheck } from 'lucide-react';
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice';
import { useGetBrandsQuery } from '@/state/api/brands-api-slice';
import { cn } from '@/lib/utils';

export function Footer({
  className,
  variant = 'full',
}: {
  className?: string;
  variant?: 'full' | 'compact';
}) {
  const locale = useLocale();
  const isCompact = variant === 'compact';

  const { data: categories = [], isLoading: isCategoriesLoading } = useGetCategoriesQuery(undefined, {
    skip: isCompact,
  });
  const { data: brands = [], isLoading: isBrandsLoading } = useGetBrandsQuery(undefined, {
    skip: isCompact,
  });

  const topCategories = useMemo(() => {
    const roots = categories.filter((c) => !c.parent_id);
    return (roots.length > 0 ? roots : categories).slice(0, 10);
  }, [categories]);

  const topBrands = useMemo(() => {
    return brands.slice(0, 10);
  }, [brands]);

  if (isCompact) {
    return (
      <footer className={cn('bg-primary text-white', className)}>
        <div className="container mx-auto px-6 sm:px-8 lg:px-16 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
            <div className="font-semibold">Boukir</div>
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/shop`}
                className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
              >
                Boutique
              </Link>
              <Link
                href={`/${locale}/orders`}
                className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
              >
                Mes commandes
              </Link>
            </div>
          </div>
          <div className="mt-2 text-xs text-white/70">© {new Date().getFullYear()} Boukir • Tous droits réservés.</div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn('relative mt-12 bg-primary text-white overflow-hidden', className)}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.07] mask-[linear-gradient(to_bottom,transparent_0%,black_70%,black_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_90%,black_100%)]">
        <Image
          src="/droguerie-pattern.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-transparent via-black/5 to-black/25" />
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 py-12">
        {/* Nos engagements */}
        <div className="mb-10 rounded-2xl border border-white/15 bg-white/5 p-6">
          <h2 className="text-lg font-extrabold tracking-tight">Nos engagements</h2>
          <p className="mt-1 text-sm text-white/80">Livraison rapide, paiement sécurisé et service client à l’écoute.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">Livraison partout au Maroc</div>
                <div className="mt-1 text-xs text-white/75">Suivi et service client réactif.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">Paiement sécurisé</div>
                <div className="mt-1 text-xs text-white/75">Transactions protégées et fiables.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">Plusieurs modes de paiement</div>
                <div className="mt-1 text-xs text-white/75">Carte, virement, paiement à la livraison.</div>
              </div>
            </div>
          </div>

          {/* Payment visuals */}
          <div className="mt-6">
            <div className="text-sm font-semibold">Paiements acceptés</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Image
                src="/payments/visa.svg"
                alt="Visa"
                width={52}
                height={32}
                sizes="52px"
                className="h-7 w-auto opacity-95"
              />
              <Image
                src="/payments/master-card.svg"
                alt="Mastercard"
                width={52}
                height={32}
                sizes="52px"
                className="h-7 w-auto opacity-95"
              />
              <Image
                src="/payments/naps.png"
                alt="NAPS"
                width={52}
                height={32}
                sizes="52px"
                className="h-7 w-auto opacity-95"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-base font-bold tracking-tight">Catégories</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/90">
              {isCategoriesLoading ? (
                <li className="opacity-80">Chargement…</li>
              ) : topCategories.length === 0 ? (
                <li className="opacity-80">Aucune catégorie</li>
              ) : (
                topCategories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/${locale}/shop?category_id=${encodeURIComponent(String(c.id))}`}
                      className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
                    >
                      {c.nom}
                    </Link>
                  </li>
                ))
              )}
              <li className="pt-2">
                <Link
                  href={`/${locale}/shop`}
                  className="text-white font-semibold hover:underline underline-offset-4 transition-colors duration-200"
                >
                  Voir la boutique
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold tracking-tight">Marques</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/90">
              {isBrandsLoading ? (
                <li className="opacity-80">Chargement…</li>
              ) : topBrands.length === 0 ? (
                <li className="opacity-80">Aucune marque</li>
              ) : (
                topBrands.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/${locale}/shop?brand_id=${encodeURIComponent(String(b.id))}`}
                      className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
                    >
                      {b.nom}
                    </Link>
                  </li>
                ))
              )}
              <li className="pt-2">
                <Link
                  href={`/${locale}/shop`}
                  className="text-white font-semibold hover:underline underline-offset-4 transition-colors duration-200"
                >
                  Voir toutes les marques
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold tracking-tight">Service client</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/90">
              <li>
                <Link
                  href={`/${locale}/orders`}
                  className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
                >
                  Suivre mes commandes
                </Link>
              </li>
              <li>
                <a href="#" className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200">
                  Aide & FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200">
                  Retours & remboursements
                </a>
              </li>
              <li>
                <a href="#" className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200">
                  Conditions générales (CGV)
                </a>
              </li>
              <li>
                <a href="#" className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200">
                  Politique de confidentialité
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold tracking-tight">Livraison & paiement</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/90">
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4" />
                <span>Livraison partout au Maroc</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4" />
                <span>Paiement sécurisé (SSL)</span>
              </li>
              <li className="flex items-start gap-2">
                <CreditCard className="mt-0.5 h-4 w-4" />
                <span>Carte bancaire, virement, paiement à la livraison</span>
              </li>
            </ul>

            <div className="mt-6">
              <div className="text-sm font-bold tracking-tight">Suivez-nous</div>
              <div className="mt-3 flex items-center gap-3">
                <a
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="mt-6 text-xs text-white/80">
              <div>© {new Date().getFullYear()} Boukir</div>
              <div className="mt-1">Tous droits réservés.</div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-xs text-white/70">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>Marketplace marocaine • Livraison rapide • Paiement sécurisé</div>
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/shop`}
                className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
              >
                Boutique
              </Link>
              <Link
                href={`/${locale}/orders`}
                className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
              >
                Mes commandes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
