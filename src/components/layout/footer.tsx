'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Facebook, Instagram, Youtube, Truck, CreditCard, ShieldCheck } from 'lucide-react';
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice';
import { useGetBrandsQuery } from '@/state/api/brands-api-slice';
import { cn } from '@/lib/utils';
import { FooterStoreMap } from './footer-store-map';

function getCategoryLabel(category: { nom: string; nom_ar?: string | null; nom_en?: string | null; nom_zh?: string | null }, locale: string) {
  if (locale === 'ar') return category.nom_ar || category.nom;
  if (locale === 'en') return category.nom_en || category.nom;
  if (locale === 'zh') return category.nom_zh || category.nom;
  return category.nom;
}

export function Footer({
  className,
  variant = 'full',
}: {
  className?: string;
  variant?: 'full' | 'compact';
}) {
  const locale = useLocale();
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
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
                {t('shopLink')}
              </Link>
              <Link
                href={`/${locale}/orders`}
                className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
              >
                {t('ordersLink')}
              </Link>
            </div>
          </div>
          <div className="mt-2 text-xs text-white/70">{t('rightsInline', { year: new Date().getFullYear() })}</div>
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
          <h2 className="text-lg font-extrabold tracking-tight">{t('commitmentsTitle')}</h2>
          <p className="mt-1 text-sm text-white/80">{t('commitmentsSubtitle')}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">{t('commitmentDeliveryTitle')}</div>
                <div className="mt-1 text-xs text-white/75">{t('commitmentDeliveryDesc')}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">{t('commitmentSecurePaymentTitle')}</div>
                <div className="mt-1 text-xs text-white/75">{t('commitmentSecurePaymentDesc')}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">{t('commitmentPaymentMethodsTitle')}</div>
                <div className="mt-1 text-xs text-white/75">{t('commitmentPaymentMethodsDesc')}</div>
              </div>
            </div>
          </div>

          {/* Payment visuals */}
          <div className="mt-6">
            <div className="text-sm font-semibold">{t('acceptedPayments')}</div>
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
            <h3 className="text-base font-bold tracking-tight">{t('categoriesTitle')}</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/90">
              {isCategoriesLoading ? (
                <li className="opacity-80">{tCommon('loading')}</li>
              ) : topCategories.length === 0 ? (
                  <li className="opacity-80">{t('emptyCategories')}</li>
              ) : (
                topCategories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/${locale}/shop?category_id=${encodeURIComponent(String(c.id))}`}
                      className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
                    >
                      {getCategoryLabel(c, locale)}
                    </Link>
                  </li>
                ))
              )}
              <li className="pt-2">
                <Link
                  href={`/${locale}/shop`}
                  className="text-white font-semibold hover:underline underline-offset-4 transition-colors duration-200"
                >
                  {t('viewShop')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold tracking-tight">{t('brandsTitle')}</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/90">
              {isBrandsLoading ? (
                <li className="opacity-80">{tCommon('loading')}</li>
              ) : topBrands.length === 0 ? (
                  <li className="opacity-80">{t('emptyBrands')}</li>
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
                  {t('viewAllBrands')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold tracking-tight">{t('customerServiceTitle')}</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/90">
              <li>
                <Link
                  href={`/${locale}/orders`}
                  className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
                >
                  {t('trackOrders')}
                </Link>
              </li>
              <li>
                <a href="#" className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200">
                  {t('helpFaq')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200">
                  {t('returnsRefunds')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200">
                  {t('termsAndConditions')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200">
                  {t('privacyPolicy')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold tracking-tight">{t('deliveryPaymentTitle')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/90">
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4" />
                <span>{t('deliveryAllMorocco')}</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4" />
                <span>{t('securePaymentSsl')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CreditCard className="mt-0.5 h-4 w-4" />
                <span>{t('paymentMethodsList')}</span>
              </li>
            </ul>

            <div className="mt-6">
              <div className="text-sm font-bold tracking-tight">{t('followUs')}</div>
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
              <div>{t('copyrightLine', { year: new Date().getFullYear() })}</div>
              <div className="mt-1">{t('rightsReserved')}</div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <FooterStoreMap
            title={t('storeLocationTitle')}
            description={t('storeLocationDesc')}
            openLabel={t('openInMaps')}
            unavailableLabel={t('storeLocationUnavailable')}
          />
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-xs text-white/70">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>{t('bottomTagline')}</div>
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/shop`}
                className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
              >
                {t('shopLink')}
              </Link>
              <Link
                href={`/${locale}/orders`}
                className="text-white/85 hover:text-white hover:underline underline-offset-4 transition-colors duration-200"
              >
                {t('ordersLink')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
