import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { MaalemDirectoryCard } from '@/components/maalems/maalem-directory-card'
import Image from 'next/image'
import styles from '@/components/maalems/directory.module.css'

import { normalizeLocale } from '@/i18n/locale'
import { localizedCategoryName, quickServiceRequestHref } from '@/lib/service-catalog'
import { getPublicMaalems } from '@/lib/service-requests'
import { buildPageMetadata } from '@/lib/seo/metadata'

type Query = Record<string, string | string[] | undefined>
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value
const integer = (value: string | undefined) => { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? n : undefined }

function href(locale: string, values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
  const query = params.toString()
  return `/${locale}/maalems${query ? `?${query}` : ''}`
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Query> }): Promise<Metadata> {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams])
  const locale = normalizeLocale(rawLocale)
  const t = await getTranslations({ locale, namespace: 'maalemsPage' })
  const filtered = ['q', 'category_id', 'service_id', 'city', 'zone', 'min_experience', 'min_interventions', 'min_rating'].some((key) => Boolean(first(query[key])))
    || (first(query.sort) && first(query.sort) !== 'recommended') || (integer(first(query.page)) || 1) > 1
  return buildPageMetadata({ locale, title: t('metadataTitle'), description: t('metadataDescription'), path: '/maalems', indexable: !filtered })
}

export default async function MaalemsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Query> }) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams])
  const locale = normalizeLocale(rawLocale)
  const t = await getTranslations({ locale, namespace: 'maalemsPage' })
  const filters = {
    q: (first(query.q) || '').trim().slice(0, 100), category_id: integer(first(query.category_id)), service_id: integer(first(query.service_id)),
    city: (first(query.city) || '').trim().slice(0, 100), zone: (first(query.zone) || '').trim().slice(0, 100),
    min_experience: integer(first(query.min_experience)), min_interventions: integer(first(query.min_interventions)),
    min_rating: integer(first(query.min_rating)),
    sort: first(query.sort) || 'recommended', page: integer(first(query.page)) || 1, per_page: 12,
  }
  let data = null
  try { data = await getPublicMaalems(filters) } catch { /* Render a useful retry state. */ }
  const hasFilters = Boolean(filters.q || filters.category_id || filters.service_id || filters.city || filters.zone || filters.min_experience || filters.min_interventions || filters.min_rating || filters.sort !== 'recommended')
  const hasAdvancedFilters = Boolean(filters.city || filters.zone || filters.min_experience || filters.min_interventions || filters.min_rating || filters.sort !== 'recommended')
  const returnTo = href(locale, filters)
  const labels = { verified: t('verified'), city: t('city'), areas: t('areas'), experience: t('experienceLabel', { years: '{years}' }), noPhoto: t('noPhoto'), interventions: t('interventionsLabel', { count: '{count}' }), declared: t('declared'), profile: t('profile'), request: t('request'), ratingLabel: t('ratingLabel', { rating: '{rating}', count: '{count}' }), verifiedReviews: t('verifiedReviews'), noReviews: t('noReviews') }

  const searchHref = `/${locale}/maalems`
  const quickHref = quickServiceRequestHref(locale, returnTo)
  return <div className={styles.page} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t('eyebrow')}</p>
          <h1 className={styles.title}>{t('title')} <em>{t('titleAccent')}</em></h1>
          <p className={styles.description}>{t('description')}</p>
          <div className={styles.heroActions}>
            <a href="#find-maalem" className={styles.primary}>{t('explore')}<ArrowRight className={styles.arrow} aria-hidden="true" /></a>
            <Link href={quickHref} className={styles.textLink}>{t('quick')}<ArrowUpRight className={styles.arrow} aria-hidden="true" /></Link>
          </div>
        </div>
        <figure className={styles.heroFigure}>
          <Image src="/utility-types/professionnel-atelier-editorial-2026.webp" alt={t('heroAlt')} fill priority sizes="(max-width: 800px) 100vw, 50vw" className={styles.heroImage} />
          <figcaption className={styles.heroCaption}><div><strong>{t('heroCaption')}</strong><span>{t('heroCaptionDetail')}</span></div><ArrowUpRight aria-hidden="true" /></figcaption>
        </figure>
      </header>

      <section id="find-maalem" className={styles.searchPanel} aria-labelledby="search-heading">
        <div className={styles.searchIntro}><h2 id="search-heading">{t('searchTitle')}</h2><span>{t('searchHint')}</span></div>
        <form action={searchHref} method="get">
          <div className={styles.searchGrid}>
            <label className={styles.field}>{t('search')}<span className={styles.inputIcon}><Search aria-hidden="true" /><input name="q" defaultValue={filters.q} placeholder={t('searchPlaceholder')} /></span></label>
            <label className={styles.field}>{t('category')}<select name="category_id" defaultValue={filters.category_id || ''}><option value="">{t('allCategories')}</option>{data?.filters.categories.map(item => <option key={item.id} value={item.id}>{localizedCategoryName(item, locale)}</option>)}</select></label>
            <label className={styles.field}>{t('service')}<select name="service_id" defaultValue={filters.service_id || ''}><option value="">{t('allServices')}</option>{data?.filters.services.map(item => <option key={item.id} value={item.id}>{localizedCategoryName(item, locale)}</option>)}</select></label>
            <button type="submit" className={styles.primary}><Search className={styles.arrow} aria-hidden="true" />{t('submit')}</button>
          </div>
          <details className={styles.advanced} open={hasAdvancedFilters}>
            <summary><SlidersHorizontal className={styles.arrow} aria-hidden="true" />{t('advancedFilters')}<span>{hasAdvancedFilters ? t('activeAdvancedFilters') : t('optionalFilters')}</span><ChevronDown className={styles.arrow} aria-hidden="true" /></summary>
            <div className={styles.advancedGrid}>
              <label className={styles.field}>{t('city')}<input name="city" defaultValue={filters.city} /></label>
              <label className={styles.field}>{t('zone')}<input name="zone" defaultValue={filters.zone} /></label>
              <label className={styles.field}>{t('experience')}<input type="number" min="0" max="70" name="min_experience" defaultValue={filters.min_experience} /></label>
              <label className={styles.field}>{t('interventions')}<input type="number" min="0" name="min_interventions" defaultValue={filters.min_interventions} /></label>
              <label className={styles.field}>{t('minimumRating')}<select name="min_rating" defaultValue={filters.min_rating || ''}><option value="">{t('allRatings')}</option>{[5,4,3,2,1].map(rating => <option key={rating} value={rating}>{t('minimumRatingOption', { rating })}</option>)}</select></label>
              <label className={styles.field}>{t('sort')}<select name="sort" defaultValue={filters.sort}><option value="recommended">{t('recommended')}</option><option value="rating_desc">{t('ratingSort')}</option><option value="interventions_desc">{t('interventionsSort')}</option><option value="experience_desc">{t('experienceSort')}</option><option value="name_asc">{t('nameSort')}</option></select></label>
            </div>
            <div className={styles.advancedActions}><button type="submit" className={styles.secondary}>{t('applyAdvancedFilters')}</button><p>{filters.sort === 'rating_desc' ? t('ratingSortNotice', { count: data?.filters.rating_sort_min_reviews || 3 }) : t('sortNotice', { sort: t(filters.sort === 'recommended' ? 'recommended' : filters.sort === 'interventions_desc' ? 'interventionsSort' : filters.sort === 'experience_desc' ? 'experienceSort' : 'nameSort') })}</p></div>
          </details>
          {hasFilters && <Link href={searchHref} className={styles.textLink}>{t('reset')}</Link>}
        </form>
      </section>
      {Boolean(data?.filters.categories.length) && <nav className={styles.categoryLinks} aria-label={t('browseCategories')}><span>{t('browseCategories')}</span>{data?.filters.categories.slice(0,5).map(category => <Link key={category.id} className={styles.categoryLink} aria-current={filters.category_id === category.id ? 'true' : undefined} href={`${href(locale, { ...filters, category_id: category.id, service_id: undefined, page: undefined, per_page: undefined })}#directory`}>{localizedCategoryName(category, locale)}<ArrowUpRight className={styles.arrow} aria-hidden="true" /></Link>)}</nav>}

      <section id="directory" className={styles.results} aria-labelledby="directory-heading">
        <div className={styles.resultsHeading}><div><p className={styles.eyebrow}>{t('directoryEyebrow')}</p><h2 id="directory-heading" className={styles.sectionTitle}>{t('directoryTitle')}</h2></div>{data && <p className={styles.resultCount} aria-live="polite">{t('count', { count: data.pagination.total_items })}</p>}</div>
        <p className={styles.resultsNotice}>{t('declared')}</p>
        {!data ? <div className={styles.state} role="alert"><ShieldCheck className={styles.stateIcon} aria-hidden="true" /><h3>{t('error')}</h3><p>{t('quickDescription')}</p><div className={styles.stateActions}><Link href={href(locale, filters)} className={styles.secondary}>{t('retry')}</Link><Link href={quickHref} className={styles.primary}>{t('quick')}<ArrowRight className={styles.arrow} aria-hidden="true" /></Link></div></div>
          : data.maalems.length === 0 ? <div className={styles.state}><Search className={styles.stateIcon} aria-hidden="true" /><h3>{t('empty')}</h3><p>{t('emptyHint')}</p><div className={styles.stateActions}>{hasFilters && <Link href={searchHref} className={styles.secondary}>{t('reset')}</Link>}<Link href={quickHref} className={styles.primary}>{t('quick')}<ArrowRight className={styles.arrow} aria-hidden="true" /></Link></div></div>
          : <div className={styles.directoryGrid}>{data.maalems.map(maalem => <MaalemDirectoryCard key={maalem.id} maalem={maalem} locale={locale} stats={maalem.statistics} labels={labels} />)}</div>}
        {data && data.pagination.total_pages > 1 && <nav className={styles.pagination} aria-label={t('pagination')}>
          {data.pagination.has_previous ? <Link className={styles.secondary} href={href(locale, { ...filters, page: data.pagination.current_page - 1, per_page: undefined })}><ArrowLeft className={styles.arrow} aria-hidden="true" />{t('previous')}</Link> : <span className={`${styles.secondary} ${styles.disabled}`} aria-disabled="true"><ArrowLeft className={styles.arrow} aria-hidden="true" />{t('previous')}</span>}
          <span>{t('page', { page: data.pagination.current_page })} / {data.pagination.total_pages}</span>
          {data.pagination.has_next ? <Link className={styles.secondary} href={href(locale, { ...filters, page: data.pagination.current_page + 1, per_page: undefined })}>{t('next')}<ArrowRight className={styles.arrow} aria-hidden="true" /></Link> : <span className={`${styles.secondary} ${styles.disabled}`} aria-disabled="true">{t('next')}<ArrowRight className={styles.arrow} aria-hidden="true" /></span>}
        </nav>}
      </section>

      <section className={styles.howItWorks} aria-labelledby="how-heading">
        <div><p className={styles.eyebrow}>{t('howEyebrow')}</p><h2 id="how-heading" className={styles.sectionTitle}>{t('howTitle')}</h2></div>
        <ol className={styles.steps}>{(['01','02','03'] as const).map((number, index) => <li key={number}><span className={styles.stepNumber} aria-hidden="true">{number}</span><h3>{t(`step${index + 1}Title`)}</h3><p>{t(`step${index + 1}Description`)}</p></li>)}</ol>
        <div className={styles.quickCta}><p>{t('quickDescription')}</p><Link href={quickHref} className={styles.primary}>{t('quick')}<ArrowRight className={styles.arrow} aria-hidden="true" /></Link></div>
      </section>
    </div>
  </div>
}
