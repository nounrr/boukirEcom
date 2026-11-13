/**
 * Numeric core for BOUKIR SMART CALCULATORS.
 *
 * Pure, framework-free helpers. Every calculator formula is built on these so
 * validation, rounding and locale-aware parsing behave identically everywhere.
 * Visual/animated numbers in the UI are display-only: results always come
 * from these raw computations.
 */

export type IssueCode = 'invalid' | 'negative' | 'tooLarge' | 'zero' | 'required'

export interface CalcIssue {
  field: string
  code: IssueCode
}

export type CalcResult<T> =
  | { ok: true; value: T; issues: CalcIssue[] }
  | { ok: false; issues: CalcIssue[] }

/** Upper bounds that keep inputs physically plausible for a building site. */
export const LIMITS = {
  lengthM: 1000,
  areaM2: 1_000_000,
  cm: 2000,
  mm: 1000,
  pct: 100,
  coats: 10,
  count: 100_000,
  kg: 100_000,
  liters: 10_000,
  density: 25,
  price: 10_000_000,
  coverage: 1000,
  dosage: 1000,
  degrees: 75,
} as const

const EPSILON = 1e-9

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩'
const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹'

/**
 * Parses user-typed decimals in French, English and Arabic conventions:
 * "2,5" · "2.5" · "1 250,75" · "1,250.75" · "٢٫٥" · "۲.۵".
 * Returns null for empty or invalid input (never NaN).
 */
export function parseDecimal(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null
  if (typeof input !== 'string') return null
  let s = input.trim()
  if (!s) return null

  s = s
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(EASTERN_ARABIC.indexOf(d)))
    .replace(/٫/g, '.')
    .replace(/٬/g, '')
    .replace(/[\s  ']/g, '')

  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (lastComma > -1) {
    const commas = s.match(/,/g)?.length ?? 0
    s = commas > 1 ? s.replace(/,/g, '') : s.replace(',', '.')
  }

  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Round up for indivisible purchases (bags, boxes, tiles…), robust to float noise. */
export function ceilUnits(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.ceil(value - EPSILON)
}

/** Round to a fixed number of decimals (half away from zero). */
export function round(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0
  const f = 10 ** decimals
  return Math.sign(value) * Math.round(Math.abs(value) * f + EPSILON) / f
}

export interface NumRule {
  min?: number
  max?: number
  /** Value must be strictly greater than zero (used for divisors). */
  positive?: boolean
  /** Optional fields may be null/undefined and resolve to `fallback`. */
  optional?: boolean
  fallback?: number
  integer?: boolean
}

/** Collects validation issues while reading numeric inputs. */
export class Validator {
  readonly issues: CalcIssue[] = []

  num(field: string, raw: unknown, rule: NumRule = {}): number {
    const { min = 0, max = Number.MAX_SAFE_INTEGER, positive = false, optional = false, fallback = 0, integer = false } = rule
    if (raw === null || raw === undefined || raw === '') {
      if (optional) return fallback
      this.issues.push({ field, code: 'required' })
      return fallback
    }
    const value = parseDecimal(raw)
    if (value === null) {
      this.issues.push({ field, code: 'invalid' })
      return fallback
    }
    if (value < 0 && min >= 0) {
      this.issues.push({ field, code: 'negative' })
      return fallback
    }
    if (value < min) {
      this.issues.push({ field, code: 'invalid' })
      return fallback
    }
    if (value > max) {
      this.issues.push({ field, code: 'tooLarge' })
      return fallback
    }
    if (positive && value <= 0) {
      this.issues.push({ field, code: 'zero' })
      return fallback
    }
    return integer ? Math.round(value) : value
  }

  /** Optional price: null means "price unavailable" — never treated as zero. */
  price(field: string, raw: unknown): number | null {
    if (raw === null || raw === undefined || raw === '') return null
    const value = parseDecimal(raw)
    if (value === null) {
      this.issues.push({ field, code: 'invalid' })
      return null
    }
    if (value < 0) {
      this.issues.push({ field, code: 'negative' })
      return null
    }
    if (value > LIMITS.price) {
      this.issues.push({ field, code: 'tooLarge' })
      return null
    }
    return value
  }

  result<T>(build: () => T): CalcResult<T> {
    if (this.issues.length > 0) return { ok: false, issues: this.issues }
    return { ok: true, value: build(), issues: [] }
  }
}

/** Multiply a cost only when a trusted unit price exists. */
export function costOrNull(quantity: number, unitPrice: number | null | undefined): number | null {
  if (unitPrice === null || unitPrice === undefined || !Number.isFinite(unitPrice)) return null
  return round(quantity * unitPrice, 2)
}

export function withWaste(value: number, wastePct: number): number {
  return value * (1 + wastePct / 100)
}
