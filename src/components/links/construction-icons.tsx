import type { SVGProps } from "react"

/**
 * Pictos "droguerie / matériaux" en trait doré, utilisés comme décor flottant
 * de la page Links. Tous partagent la même viewBox 0 0 64 64.
 */

type IconProps = SVGProps<SVGSVGElement>

const base: IconProps = {
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
}

/** Sac de ciment */
export function CementBag(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 20h36l2 32H12z" />
      <path d="M14 20c4-5 8-6 18-6s14 1 18 6" />
      <path d="M16 30h32M16 42h32" />
      <text x="32" y="39" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" stroke="none" letterSpacing="1">CIMENT</text>
      <path d="M22 12v-2M42 12v-2" />
    </svg>
  )
}

/** Tas de sable */
export function SandPile(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 50c8-16 16-26 26-30 10 4 18 14 26 30z" />
      <path d="M18 44c6-8 10-12 14-14M30 46c4-4 8-8 12-10" strokeOpacity="0.6" />
      <circle cx="26" cy="38" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="36" cy="42" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="44" cy="46" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="20" cy="47" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="32" cy="30" r="0.8" fill="currentColor" stroke="none" />
      <path d="M4 54h56" />
    </svg>
  )
}

/** Disque diamant (segments) */
export function DiamondDisc(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="32" cy="32" r="26" strokeDasharray="9 4" strokeWidth="3" />
      <circle cx="32" cy="32" r="20" />
      <circle cx="32" cy="32" r="4" />
      <path d="M32 12v6M32 46v6M12 32h6M46 32h6M18 18l4 4M42 42l4 4M46 18l-4 4M22 42l-4 4" strokeOpacity="0.7" />
      <path d="M28 8l4-4 4 4-4 4z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Disque acier (abrasif) */
export function SteelDisc(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="32" cy="32" r="27" />
      <circle cx="32" cy="32" r="10" />
      <circle cx="32" cy="32" r="3.5" />
      <path d="M32 5v10M32 49v10M5 32h10M49 32h10M13 13l7 7M44 44l7 7M51 13l-7 7M20 44l-7 7" strokeOpacity="0.55" />
      <circle cx="32" cy="32" r="18" strokeDasharray="2 3" strokeOpacity="0.6" />
    </svg>
  )
}

/** Lame de scie circulaire */
export function CircularSaw(props: IconProps) {
  const teeth: string[] = []
  const n = 16
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2
    const a2 = ((i + 0.55) / n) * Math.PI * 2
    const a3 = ((i + 1) / n) * Math.PI * 2
    const r1 = 22
    const r2 = 27
    const p = (a: number, r: number) => `${(32 + Math.cos(a) * r).toFixed(1)} ${(32 + Math.sin(a) * r).toFixed(1)}`
    teeth.push(`${i === 0 ? "M" : "L"}${p(a1, r1)} L${p(a2, r2)} L${p(a3, r1)}`)
  }
  return (
    <svg {...base} {...props}>
      <path d={teeth.join(" ") + " Z"} />
      <circle cx="32" cy="32" r="5" />
      <circle cx="32" cy="32" r="14" strokeOpacity="0.5" />
      <path d="M32 18v-2M32 48v-2M18 32h-2M48 32h-2" strokeOpacity="0.5" />
    </svg>
  )
}

/** Scie égoïne */
export function HandSaw(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 22h40l8 8H14z" />
      <path d="M14 30l2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3" strokeWidth="1.2" />
      <path d="M48 22c6-2 10 2 10 8s-4 10-10 8l-6-8z" />
      <circle cx="52" cy="28" r="2" strokeOpacity="0.6" />
    </svg>
  )
}

/** Truelle */
export function Trowel(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 44L32 14l16 16-26 26z" />
      <path d="M32 30l10-10" strokeOpacity="0.6" />
      <path d="M42 22l4-4 4 4M46 18l10 10" />
      <path d="M48 26l8 8c2 2 2 4 0 6l-2 2c-2 2-4 2-6 0l-8-8" />
    </svg>
  )
}

/** Briques */
export function Bricks(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="40" width="24" height="12" rx="1" />
      <rect x="34" y="40" width="24" height="12" rx="1" />
      <rect x="20" y="26" width="24" height="12" rx="1" />
      <rect x="6" y="26" width="12" height="12" rx="1" strokeOpacity="0.6" />
      <rect x="46" y="26" width="12" height="12" rx="1" strokeOpacity="0.6" />
      <rect x="6" y="12" width="24" height="12" rx="1" />
      <rect x="34" y="12" width="24" height="12" rx="1" />
    </svg>
  )
}

/** Meuleuse d'angle */
export function Grinder(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M22 30h30a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H22z" />
      <path d="M22 28v14a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-8a6 6 0 0 1 6-6z" />
      <circle cx="14" cy="18" r="9" />
      <circle cx="14" cy="18" r="2" />
      <path d="M14 27v3" />
      <path d="M30 33h18M30 37h18" strokeOpacity="0.5" />
      <path d="M40 30v-4h6v4" strokeOpacity="0.7" />
    </svg>
  )
}

/** Fer à béton */
export function Rebar(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 44c10 0 12-24 24-24s14 24 24 24" strokeWidth="3" />
      <path d="M14 43l2-4M20 36l2-4M26 26l2-3M38 26l-2-3M44 36l-2-4M50 43l-2-4M32 21v-3" strokeOpacity="0.7" />
      <path d="M6 52h52" strokeOpacity="0.4" />
    </svg>
  )
}

/** Seau */
export function Bucket(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 24h36l-4 30H18z" />
      <ellipse cx="32" cy="24" rx="18" ry="4" />
      <path d="M16 24c0-10 8-16 16-16s16 6 16 16" strokeOpacity="0.7" />
      <path d="M20 36h24" strokeOpacity="0.5" />
    </svg>
  )
}

/** Casque de chantier */
export function Helmet(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 40c0-14 8-24 20-24s20 10 20 24" />
      <path d="M6 40h52c0 4-2 6-6 6H12c-4 0-6-2-6-6z" />
      <path d="M28 16h8v10h-8z" strokeOpacity="0.7" />
      <path d="M20 32c2-6 6-10 12-10" strokeOpacity="0.5" />
    </svg>
  )
}

/** Perceuse */
export function Drill(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20h30a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z" />
      <path d="M46 26h12M50 24v4" />
      <path d="M18 36v14a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V36" />
      <path d="M14 26h6M32 36l4 6" strokeOpacity="0.6" />
    </svg>
  )
}

/** Diamant (rappel du logo) */
export function Gem(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M16 14h32l10 14-26 30L6 28z" />
      <path d="M6 28h52M16 14l8 14 8-14 8 14 8-14M24 28l8 30 8-30" strokeOpacity="0.6" />
    </svg>
  )
}
