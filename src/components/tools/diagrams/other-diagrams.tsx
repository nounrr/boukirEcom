"use client"

import { useId } from "react"
import { formatNumber } from "@/components/motion/primitives"
import { cn } from "@/lib/utils"

const GOLD = "#f29f04"
const GOLD_2 = "#f2b705"

function Label({ x, y, text, rotate = 0 }: { x: number; y: number; text: string; rotate?: number }) {
  const w = Math.max(64, text.length * 7.6 + 18)
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x={-w / 2} y={-12} width={w} height={24} rx={12} className="fill-background" stroke={GOLD} strokeOpacity="0.5" />
      <text y={4.5} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="currentColor" className="tabular">
        {text}
      </text>
    </g>
  )
}

/* ── Wall elevation: paint, blocks, plaster ─────────────────────────────── */

export function WallElevation({
  length,
  height,
  doors = 0,
  windows = 0,
  blockL,
  blockH,
  developed = false,
  locale,
  labels,
  className,
}: {
  length: number
  height: number
  doors?: number
  windows?: number
  blockL?: number | null
  blockH?: number | null
  /** room mode: show the developed (unfolded) perimeter */
  developed?: boolean
  locale: string
  labels: { length: string; height: string; developed: string }
  className?: string
}) {
  const uid = useId().replace(/:/g, "")
  const VB_W = 640
  const VB_H = 380
  const L = Math.max(0.5, Math.min(200, length || 0.5))
  const H = Math.max(0.5, Math.min(30, height || 0.5))
  const s = Math.min((VB_W - 130) / L, (VB_H - 120) / H)
  const w = L * s
  const h = H * s
  const x0 = (VB_W - w) / 2 + 14
  const y0 = VB_H - 52 - h

  // Openings laid out evenly; drawn count capped for legibility.
  const dW = 0.9 * s
  const dH = Math.min(2.1, H * 0.92) * s
  const wW = 1.2 * s
  const wH = Math.min(1.0, H * 0.4) * s
  const slots = Math.max(0, Math.floor(L / 1.6))
  const nd = Math.min(doors, slots)
  const nw = Math.min(windows, Math.max(0, slots - nd))
  const total = nd + nw
  const openings = Array.from({ length: total }, (_, i) => {
    const cx = x0 + ((i + 1) * w) / (total + 1)
    return i < nd ? { kind: "door" as const, x: cx - dW / 2, y: y0 + h - dH, w: dW, h: dH } : { kind: "window" as const, x: cx - wW / 2, y: y0 + h - Math.min(1.0 * s + wH, h * 0.85), w: wW, h: wH }
  })

  let bricks = ""
  let dense = false
  if (blockL && blockH && blockL > 0 && blockH > 0) {
    const bw = (blockL / 100) * s
    const bh = (blockH / 100) * s
    const rows = Math.ceil(h / bh)
    const cols = Math.ceil(w / bw) + 1
    if (bw < 3 || bh < 3 || rows * cols > 2600) dense = true
    else {
      for (let r = 1; r < rows; r++) bricks += `M${x0} ${y0 + h - r * bh}H${x0 + w}`
      for (let r = 0; r < rows; r++) {
        const shift = r % 2 ? bw / 2 : 0
        for (let c = 0; c <= cols; c++) {
          const x = x0 + c * bw + shift
          if (x <= x0 || x >= x0 + w) continue
          bricks += `M${x} ${y0 + h - r * bh}V${Math.max(y0, y0 + h - (r + 1) * bh)}`
        }
      }
    }
  }

  const fmt = (v: number) => `${formatNumber(v, locale, 2)} m`

  return (
    <svg style={{ direction: "ltr", unicodeBidi: "isolate" }} viewBox={`0 0 ${VB_W} ${VB_H}`} className={cn("h-auto w-full text-foreground", className)} role="img" aria-label={`${labels.length} ${fmt(L)} × ${labels.height} ${fmt(H)}`} data-draw>
      <defs>
        <pattern id={`g-${uid}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="currentColor" strokeOpacity="0.07" />
        </pattern>
        <pattern id={`d-${uid}`} width="6" height="4" patternUnits="userSpaceOnUse">
          <path d="M6 0H0V4" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.6" />
        </pattern>
        <linearGradient id={`paint-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={GOLD_2} stopOpacity="0.16" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0.06" />
        </linearGradient>
        <clipPath id={`c-${uid}`}>
          <rect x={x0} y={y0} width={w} height={h} />
        </clipPath>
      </defs>
      <rect width={VB_W} height={VB_H} fill={`url(#g-${uid})`} />
      <line x1="24" x2={VB_W - 24} y1={y0 + h} y2={y0 + h} stroke="currentColor" strokeOpacity="0.35" />
      <rect x={x0} y={y0} width={w} height={h} fill={blockL ? "rgba(77,77,77,0.10)" : `url(#paint-${uid})`} />
      {bricks ? <path d={bricks} clipPath={`url(#c-${uid})`} stroke="currentColor" strokeOpacity="0.32" fill="none" /> : null}
      {dense ? <rect x={x0} y={y0} width={w} height={h} fill={`url(#d-${uid})`} /> : null}
      {developed && L > 2
        ? Array.from({ length: 3 }, (_, i) => (
            <line key={i} x1={x0 + ((i + 1) * w) / 4} x2={x0 + ((i + 1) * w) / 4} y1={y0} y2={y0 + h} stroke={GOLD} strokeOpacity="0.4" strokeDasharray="4 5" />
          ))
        : null}
      {openings.map((o, i) => (
        <g key={i}>
          <rect x={o.x} y={o.y} width={o.w} height={o.h} className="fill-background" stroke="currentColor" strokeOpacity="0.55" />
          {o.kind === "window" ? <path d={`M${o.x + o.w / 2} ${o.y}V${o.y + o.h}M${o.x} ${o.y + o.h / 2}H${o.x + o.w}`} stroke="currentColor" strokeOpacity="0.3" /> : <circle cx={o.x + o.w * 0.8} cy={o.y + o.h * 0.55} r={2} fill="currentColor" opacity="0.5" />}
        </g>
      ))}
      <rect x={x0} y={y0} width={w} height={h} fill="none" stroke={GOLD} strokeWidth="2" className="draw" pathLength={1} vectorEffect="non-scaling-stroke" />
      <g className="draw-fade">
        <line x1={x0} x2={x0 + w} y1={y0 - 24} y2={y0 - 24} stroke={GOLD} />
        <path d={`M${x0} ${y0 - 30}v12M${x0 + w} ${y0 - 30}v12`} stroke={GOLD} />
        <Label x={x0 + w / 2} y={y0 - 24} text={developed ? `${labels.developed} ${fmt(L)}` : fmt(L)} />
        <line x1={x0 - 26} x2={x0 - 26} y1={y0} y2={y0 + h} stroke={GOLD} />
        <path d={`M${x0 - 32} ${y0}h12M${x0 - 32} ${y0 + h}h12`} stroke={GOLD} />
        <Label x={x0 - 26} y={y0 + h / 2} text={fmt(H)} rotate={-90} />
      </g>
    </svg>
  )
}

/* ── Isometric slab / fill / waterproofed terrace ───────────────────────── */

export function SlabIso({
  length,
  width,
  depthCm,
  variant,
  locale,
  labels,
  className,
}: {
  length: number
  width: number
  depthCm: number
  variant: "concrete" | "fill" | "membrane"
  locale: string
  labels: { length: string; width: string; depth: string }
  className?: string
}) {
  const uid = useId().replace(/:/g, "")
  const VB_W = 640
  const VB_H = 400
  const L = Math.max(0.3, Math.min(200, length || 0.3))
  const W = Math.max(0.3, Math.min(200, width || 0.3))
  const cos = Math.cos(Math.PI / 6)
  const sin = 0.5
  const s = Math.min((VB_W - 140) / ((L + W) * cos), (VB_H - 170) / ((L + W) * sin))
  // Depth is exaggerated for legibility but stays proportional to its value.
  const t = Math.max(8, Math.min(70, (depthCm / 100) * s * 3 + 6))
  const ox = VB_W / 2 - ((L - W) * cos * s) / 2
  const oy = 78
  const P = (x: number, y: number, z = 0) => [ox + (x - y) * cos * s, oy + (x + y) * sin * s - z] as const
  const pts = (arr: (readonly [number, number])[]) => arr.map((p) => p.join(",")).join(" ")

  const top = [P(0, 0, t), P(L, 0, t), P(L, W, t), P(0, W, t)]
  const right = [P(L, 0, t), P(L, W, t), P(L, W, 0), P(L, 0, 0)]
  const front = [P(0, W, t), P(L, W, t), P(L, W, 0), P(0, W, 0)]

  const faces =
    variant === "fill"
      ? { top: `url(#sand-${uid})`, right: "rgba(184,140,74,0.55)", front: "rgba(160,118,58,0.6)" }
      : variant === "membrane"
        ? { top: "rgba(242,183,5,0.22)", right: "rgba(77,77,77,0.45)", front: "rgba(77,77,77,0.6)" }
        : { top: "rgba(222,222,222,0.55)", right: "rgba(150,150,150,0.55)", front: "rgba(110,110,110,0.65)" }

  const fmt = (v: number, unit = "m", d = 2) => `${formatNumber(v, locale, d)} ${unit}`
  const midL = P(L / 2, W, 0)
  const midW = P(L, W / 2, 0)
  const depthAt = P(0, W, t / 2)

  return (
    <svg style={{ direction: "ltr", unicodeBidi: "isolate" }} viewBox={`0 0 ${VB_W} ${VB_H}`} className={cn("h-auto w-full text-foreground", className)} role="img" aria-label={`${labels.length} ${fmt(L)}, ${labels.width} ${fmt(W)}, ${labels.depth} ${fmt(depthCm, "cm", 0)}`} data-draw>
      <defs>
        <pattern id={`g-${uid}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="currentColor" strokeOpacity="0.07" />
        </pattern>
        <pattern id={`sand-${uid}`} width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="rgba(214,170,98,0.55)" />
          <circle cx="2" cy="2" r="0.9" fill="rgba(120,84,36,0.5)" />
          <circle cx="5.5" cy="4.5" r="0.7" fill="rgba(120,84,36,0.4)" />
        </pattern>
      </defs>
      <rect width={VB_W} height={VB_H} fill={`url(#g-${uid})`} />
      <polygon points={pts(right)} fill={faces.right} />
      <polygon points={pts(front)} fill={faces.front} />
      <polygon points={pts(top)} fill={faces.top} />
      {variant === "concrete" ? (
        <path
          d={Array.from({ length: 5 }, (_, i) => {
            const a = P((L * (i + 1)) / 6, 0, t)
            const b = P((L * (i + 1)) / 6, W, t)
            return `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`
          }).join("")}
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeDasharray="3 4"
        />
      ) : null}
      {variant === "membrane" ? (
        <polygon points={pts([P(0, 0, t + 10), P(L, 0, t + 10), P(L, 0, t), P(0, 0, t)])} fill="rgba(242,183,5,0.35)" />
      ) : null}
      <polygon points={pts(top)} fill="none" stroke={GOLD} strokeWidth="1.8" className="draw" pathLength={1} />
      <polygon points={pts(right)} fill="none" stroke={GOLD} strokeOpacity="0.5" strokeWidth="1" />
      <polygon points={pts(front)} fill="none" stroke={GOLD} strokeOpacity="0.5" strokeWidth="1" />
      <g className="draw-fade">
        <Label x={midL[0] - 18} y={midL[1] + 30} text={fmt(L)} />
        <Label x={midW[0] + 34} y={midW[1] + 26} text={fmt(W)} />
        <line x1={depthAt[0] - 8} y1={depthAt[1]} x2={depthAt[0] - 44} y2={depthAt[1] - 26} stroke={GOLD} />
        <Label x={depthAt[0] - 82} y={depthAt[1] - 26} text={fmt(depthCm, "cm", 0)} />
      </g>
    </svg>
  )
}

/* ── Roof cross-section ─────────────────────────────────────────────────── */

export function RoofSection({
  slopeLength,
  pitchDeg,
  planes,
  eave,
  locale,
  labels,
  className,
}: {
  slopeLength: number
  pitchDeg: number | null
  planes: number
  eave: number
  locale: string
  labels: { slope: string; pitch: string; eave: string; planes: string }
  className?: string
}) {
  const VB_W = 640
  const VB_H = 340
  const angle = Math.max(5, Math.min(70, pitchDeg ?? 30))
  const rad = (angle * Math.PI) / 180
  const sl = Math.max(0.5, Math.min(100, slopeLength || 0.5))
  const run = sl * Math.cos(rad)
  const rise = sl * Math.sin(rad)
  const twoSided = planes >= 2
  const spanM = twoSided ? run * 2 : run
  const s = Math.min((VB_W - 160) / spanM, (VB_H - 120) / rise)
  const baseY = VB_H - 60
  const x0 = (VB_W - spanM * s) / 2
  const ridgeX = x0 + run * s
  const ridgeY = baseY - rise * s
  const x1 = x0 + spanM * s
  const fmt = (v: number) => `${formatNumber(v, locale, 2)} m`

  return (
    <svg style={{ direction: "ltr", unicodeBidi: "isolate" }} viewBox={`0 0 ${VB_W} ${VB_H}`} className={cn("h-auto w-full text-foreground", className)} role="img" aria-label={`${labels.slope} ${fmt(sl)}`} data-draw>
      <line x1="30" x2={VB_W - 30} y1={baseY} y2={baseY} stroke="currentColor" strokeOpacity="0.3" />
      <rect x={x0 + 12} y={baseY} width={spanM * s - 24} height="34" fill="rgba(77,77,77,0.12)" stroke="currentColor" strokeOpacity="0.2" />
      <polygon
        points={twoSided ? `${x0},${baseY} ${ridgeX},${ridgeY} ${x1},${baseY}` : `${x0},${baseY} ${ridgeX},${ridgeY} ${ridgeX},${baseY}`}
        fill="rgba(242,159,4,0.08)"
      />
      <polyline
        points={twoSided ? `${x0},${baseY} ${ridgeX},${ridgeY} ${x1},${baseY}` : `${x0},${baseY} ${ridgeX},${ridgeY} ${ridgeX},${baseY}`}
        fill="none"
        stroke={GOLD}
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="draw"
        pathLength={1}
      />
      {Array.from({ length: 9 }, (_, i) => {
        const f = (i + 1) / 10
        const x = x0 + (ridgeX - x0) * f
        const y = baseY + (ridgeY - baseY) * f
        return <line key={i} x1={x} y1={y} x2={x + 10 * Math.sin(rad)} y2={y + 10 * Math.cos(rad) * -1 + 0} stroke={GOLD_2} strokeOpacity="0.6" />
      })}
      <g className="draw-fade">
        <path d={`M${x0 + 46} ${baseY} A46 46 0 0 0 ${x0 + 46 * Math.cos(rad)} ${baseY - 46 * Math.sin(rad)}`} fill="none" stroke="currentColor" strokeOpacity="0.5" />
        <text x={x0 + 58} y={baseY - 12} fontSize="12" fontWeight="600" fill="currentColor">{pitchDeg === null ? "≈" : ""}{Math.round(angle)}°</text>
        <Label x={(x0 + ridgeX) / 2 - 28 * Math.sin(rad)} y={(baseY + ridgeY) / 2 - 28 * Math.cos(rad)} text={`${labels.slope} ${fmt(sl)}`} rotate={-angle} />
        <Label x={VB_W / 2} y={baseY + 17} text={`${labels.eave} ${fmt(eave)} · ${labels.planes} ${planes}`} />
      </g>
    </svg>
  )
}

/* ── Progress-style quantity glyphs (bags, packs…) ───────────────────────── */

export function QuantityGlyphs({ count, max = 40, label, className }: { count: number; max?: number; label: string; className?: string }) {
  const shown = Math.min(count, max)
  return (
    <div className={cn("text-foreground", className)} role="img" aria-label={`${count} ${label}`}>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: shown }, (_, i) => (
          <svg
            key={i}
            viewBox="0 0 28 34"
            className="h-9 w-7 motion-safe:animate-[bd-rise_0.6s_var(--ease-premium)_both]"
            style={{ animationDelay: `${Math.min(i, 30) * 25}ms` }}
            aria-hidden="true"
          >
            <path d="M5 6c3-2 15-2 18 0l2 22c0 3-3 4-11 4S3 31 3 28L5 6Z" fill="rgba(242,159,4,0.16)" stroke={GOLD} strokeWidth="1.3" />
            <path d="M6 6c2 1.6 14 1.6 16 0" stroke={GOLD} strokeWidth="1.3" fill="none" />
            <path d="M9 17h10M9 21h7" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.2" />
          </svg>
        ))}
        {count > max ? <span className="grid h-9 place-items-center rounded-lg bg-muted px-2.5 text-xs font-bold tabular">+{count - max}</span> : null}
      </div>
    </div>
  )
}
