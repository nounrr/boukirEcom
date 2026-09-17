import type { AppLocale } from '@/i18n/locale'

const DEFAULT_UNIT: Record<AppLocale, string> = {
  fr: 'unité', ar: 'وحدة', en: 'unit', zh: '单位',
}

const LABELS: Record<string, Record<AppLocale, string>> = {
  m: { fr: 'm', ar: 'م', en: 'm', zh: '米' },
  'm²': { fr: 'm²', ar: 'م²', en: 'm²', zh: '平方米' },
  'm³': { fr: 'm³', ar: 'م³', en: 'm³', zh: '立方米' },
  kg: { fr: 'kg', ar: 'كغ', en: 'kg', zh: '千克' },
  t: { fr: 'tonne', ar: 'طن', en: 'tonne', zh: '吨' },
  l: { fr: 'L', ar: 'لتر', en: 'L', zh: '升' },
  rouleau: { fr: 'rouleau', ar: 'لفة', en: 'roll', zh: '卷' },
  sac: { fr: 'sac', ar: 'كيس', en: 'bag', zh: '袋' },
  boite: { fr: 'boîte', ar: 'علبة', en: 'box', zh: '箱' },
  piece: { fr: 'pièce', ar: 'قطعة', en: 'piece', zh: '件' },
  camion: { fr: 'camion', ar: 'شاحنة', en: 'truckload', zh: '车' },
  fiaj: { fr: 'fiaj', ar: 'فياج', en: 'fiaj', zh: 'fiaj' },
}

function keyOf(value: string): string {
  const key = value.trim().toLocaleLowerCase('fr').normalize('NFKD').replace(/\p{M}/gu, '')
  if (/^(m|metre|meter)$/.test(key)) return 'm'
  if (/^(m2|m²|metre carre|square meter)$/.test(key)) return 'm²'
  if (/^(m3|m³|metre cube|cubic meter)$/.test(key)) return 'm³'
  if (/^(kg|kilogramme|kilogram)$/.test(key)) return 'kg'
  if (/^(t|tonne|ton)$/.test(key)) return 't'
  if (/^(l|litre|liter)$/.test(key)) return 'l'
  if (/^(rouleau|roll)$/.test(key)) return 'rouleau'
  if (/^(sac|bag)$/.test(key)) return 'sac'
  if (/^(boite|box|carton)$/.test(key)) return 'boite'
  if (/^(u|unite|piece|unit)$/.test(key)) return 'piece'
  if (/^(camion|truck|truckload)$/.test(key)) return 'camion'
  if (/^(fiaj|فياج)$/.test(key)) return 'fiaj'
  return ''
}

export function formatCommercialUnit(value: unknown, locale: AppLocale): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return DEFAULT_UNIT[locale]
  const key = keyOf(raw)
  return key ? LABELS[key][locale] : raw
}

export function formatUnitRate(currency: string, value: unknown, locale: AppLocale): string {
  return `${currency}/${formatCommercialUnit(value, locale)}`
}

export function commercialLineTotal(unitPrice: number, quantity: number): number {
  if (!Number.isFinite(unitPrice) || !Number.isFinite(quantity) || unitPrice < 0 || quantity < 0) return 0
  return Number((unitPrice * quantity).toFixed(2))
}
