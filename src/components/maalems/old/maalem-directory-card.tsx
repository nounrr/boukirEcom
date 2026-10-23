import Link from 'next/link'
import { ArrowRight, Award, BadgeCheck, MapPin, Star, Wrench } from 'lucide-react'
import { getMaalemInitials } from '@/components/service-requests/maalem-public-summary'
import { resolvePublicMaalemPhoto } from '@/lib/service-requests'
import type { PublicMaalemSummary as Maalem } from '@/types/service-request'
import styles from './directory.module.css'
import { MaalemCardMotion } from './maalem-card-motion'
import { MaalemCardPortrait } from './maalem-card-portrait'

export function MaalemDirectoryCard({ maalem, locale, stats, labels }: {
  maalem: Maalem
  locale: string
  stats: { closed_interventions: number; average_rating: number | null; review_count: number }
  labels: Record<string, string>
}) {
  const photoUrl = resolvePublicMaalemPhoto(maalem.photo_url)
  const categoryName = locale === 'ar' ? maalem.category.name_ar || maalem.category.name : maalem.category.name || maalem.category.name_ar
  const profileHref = `/${locale}/maalems/${maalem.id}`
  const hasRating = stats.average_rating != null && stats.review_count > 0
  const ratingValue = hasRating ? new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.min(5, Math.max(1, stats.average_rating as number))) : null
  const ratingLabel = hasRating ? labels.ratingLabel.replace('{rating}', ratingValue as string).replace('{count}', String(stats.review_count)) : labels.noReviews
  const blurb = maalem.professional_summary?.trim() || (maalem.skills.length > 0 ? maalem.skills.join(' · ') : null)

  const portraitProps = {
    src: photoUrl,
    name: maalem.public_name,
    initials: getMaalemInitials(maalem.public_name),
    fallbackLabel: labels.noPhoto,
  }
  const background = <MaalemCardPortrait {...portraitProps} expanded />
  const portrait = (
    <Link href={profileHref} className={styles.cardMedia} aria-label={`${labels.profile} — ${maalem.public_name}`}>
      <MaalemCardPortrait {...portraitProps} />
    </Link>
  )
  return <MaalemCardMotion portrait={portrait} background={background}>
    <div className={styles.cardMeta}><span className={styles.cardCategory}>{categoryName}</span>{maalem.city && <span className={styles.cardLocation}><MapPin aria-hidden="true" />{maalem.city}</span>}</div>
    <h3 className={styles.cardName}><Link href={profileHref}>{maalem.public_name}</Link>{maalem.is_verified && <BadgeCheck className={styles.verifiedIcon} role="img" aria-label={labels.verified} />}</h3>
    {blurb && <p className={styles.cardBlurb}>{blurb}</p>}
    <div className={styles.cardStats}>
      <span className={styles.cardRating} aria-label={ratingLabel}><Star aria-hidden="true" />{hasRating ? `${ratingValue}/5 · ${stats.review_count} ${labels.verifiedReviews}` : labels.noReviews}</span>
      <span><Wrench aria-hidden="true" />{labels.interventions.replace('{count}', String(stats.closed_interventions))}</span>
      {maalem.experience_years != null && <span><Award aria-hidden="true" />{labels.experience.replace('{years}', String(maalem.experience_years))}</span>}
    </div>
    <div className={styles.cardActions}><Link href={profileHref} className={styles.secondary}>{labels.profile}</Link><Link href={`/${locale}/service-requests/maalem/${maalem.id}`} className={styles.primary}>{labels.request}<ArrowRight className={styles.arrow} aria-hidden="true" /></Link></div>
  </MaalemCardMotion>
}
