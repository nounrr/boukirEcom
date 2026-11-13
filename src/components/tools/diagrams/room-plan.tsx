"use client"

import { useCallback, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { formatNumber } from "@/components/motion/primitives"
import { cn } from "@/lib/utils"

export type LayoutPattern = "straight" | "offset" | "diagonal" | "herringbone"

const VB_W = 640
const VB_H = 440
const PAD_X = 70
const PAD_Y = 62
const MAX_SEGMENTS = 2400

/**
 * Top-view room plan. Geometry is drawn from the numeric dimensions (never
 * the reverse); dragging a handle converts pointer travel to metres using a
 * frozen scale, then writes the rounded value back to the inputs.
 */
export function RoomPlan({
  length,
  width,
  tileL,
  tileW,
  pattern = "straight",
  onResize,
  locale,
  labels,
  maxM = 30,
  fill,
  className,
  title,
}: {
  length: number
  width: number
  tileL?: number | null
  tileW?: number | null
  pattern?: LayoutPattern
  onResize?: (next: { length?: number; width?: number }) => void
  locale: string
  labels: { length: string; width: string; area: string; handle: string }
  maxM?: number
  /** optional fill (e.g. url(#pattern) or colour) for the floor */
  fill?: string
  className?: string
  title?: string
}) {
  const uid = useId().replace(/:/g, "")
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<null | { axis: "x" | "y" | "xy"; startX: number; startY: number; startL: number; startW: number; scale: number; x0: number; y0: number }>(null)

  const L = Math.max(0.3, Math.min(maxM, length || 0.3))
  const W = Math.max(0.3, Math.min(maxM, width || 0.3))
  const fitScale = Math.min((VB_W - PAD_X * 2) / L, (VB_H - PAD_Y * 2) / W)
  const scale = drag?.scale ?? fitScale
  const rw = L * scale
  const rh = W * scale
  // While dragging, scale and origin stay frozen so the handle tracks the pointer.
  const x0 = drag ? drag.x0 : (VB_W - rw) / 2
  const y0 = drag ? drag.y0 : (VB_H - rh) / 2

  const toSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }, [])

  const start = (axis: "x" | "y" | "xy") => (event: PointerEvent<SVGGElement>) => {
    if (!onResize) return
    event.preventDefault()
    ;(event.currentTarget as Element).setPointerCapture?.(event.pointerId)
    const p = toSvg(event.clientX, event.clientY)
    setDrag({ axis, startX: p.x, startY: p.y, startL: L, startW: W, scale: fitScale, x0: (VB_W - L * fitScale) / 2, y0: (VB_H - W * fitScale) / 2 })
  }

  const move = (event: PointerEvent<SVGGElement>) => {
    if (!drag || !onResize) return
    const p = toSvg(event.clientX, event.clientY)
    const snap = (v: number) => Math.round(Math.max(0.5, Math.min(maxM, v)) * 20) / 20
    const next: { length?: number; width?: number } = {}
    if (drag.axis !== "y") next.length = snap(drag.startL + (p.x - drag.startX) / drag.scale)
    if (drag.axis !== "x") next.width = snap(drag.startW + (p.y - drag.startY) / drag.scale)
    onResize(next)
  }

  const end = () => setDrag(null)

  const onKey = (axis: "x" | "y") => (event: KeyboardEvent<SVGGElement>) => {
    if (!onResize) return
    const step = event.shiftKey ? 1 : 0.1
    const value = axis === "x" ? L : W
    let next: number | null = null
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = value + step
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = value - step
    if (event.key === "Home") next = 0.5
    if (event.key === "End") next = maxM
    if (next === null) return
    event.preventDefault()
    const v = Math.round(Math.max(0.5, Math.min(maxM, next)) * 100) / 100
    onResize(axis === "x" ? { length: v } : { width: v })
  }

  const tiles = useMemo(() => {
    if (!tileL || !tileW || tileL <= 0 || tileW <= 0) return null
    const tw = (tileL / 100) * scale
    const th = (tileW / 100) * scale
    if (tw < 2.5 || th < 2.5) return { kind: "dense" as const }
    const nx = Math.ceil(rw / tw)
    const ny = Math.ceil(rh / th)
    const paths: string[] = []
    if (pattern === "diagonal") {
      const side = Math.min(tw, th) * Math.SQRT2
      const span = rw + rh
      const count = Math.ceil(span / side)
      if (count * 2 > MAX_SEGMENTS) return { kind: "dense" as const }
      for (let k = 1; k < count; k++) {
        const c = k * side
        paths.push(`M${x0 + c} ${y0}L${x0 + c - span} ${y0 + span}`)
        paths.push(`M${x0 + c - rh} ${y0}L${x0 + c - rh + span} ${y0 + span}`)
      }
    } else if (pattern === "herringbone") {
      const unit = Math.min(tw, th)
      const rows = Math.ceil(rh / unit)
      const cols = Math.ceil(rw / (unit * 2))
      if (rows * cols > MAX_SEGMENTS) return { kind: "dense" as const }
      for (let r = 0; r <= rows; r++) {
        let d = `M${x0} ${y0 + r * unit}`
        for (let c = 0; c <= cols; c++) d += `l${unit} ${-unit / 2}l${unit} ${unit / 2}`
        paths.push(d)
      }
      for (let c = 0; c <= cols * 2; c++) paths.push(`M${x0 + c * unit} ${y0}V${y0 + rh}`)
    } else {
      if (nx * ny > MAX_SEGMENTS) return { kind: "dense" as const }
      for (let j = 1; j < ny; j++) paths.push(`M${x0} ${y0 + j * th}H${x0 + rw}`)
      if (pattern === "offset") {
        for (let j = 0; j < ny; j++) {
          const shift = j % 2 ? tw / 2 : 0
          for (let i = 0; i <= nx; i++) {
            const x = x0 + i * tw + shift
            if (x <= x0 || x >= x0 + rw) continue
            paths.push(`M${x} ${y0 + j * th}V${Math.min(y0 + (j + 1) * th, y0 + rh)}`)
          }
        }
      } else {
        for (let i = 1; i < nx; i++) paths.push(`M${x0 + i * tw} ${y0}V${y0 + rh}`)
      }
    }
    return { kind: "lines" as const, d: paths.join("") }
  }, [tileL, tileW, scale, rw, rh, x0, y0, pattern])

  const fmt = (v: number) => `${formatNumber(v, locale, 2)} m`
  const area = L * W
  const interactive = Boolean(onResize)

  return (
    <svg
      ref={svgRef}
      style={{ direction: "ltr", unicodeBidi: "isolate" }}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={cn("h-auto w-full touch-none select-none", className)}
      role="img"
      aria-label={title ?? `${labels.length} ${fmt(L)} × ${labels.width} ${fmt(W)}`}
      data-draw
    >
      <defs>
        <pattern id={`grid-${uid}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
        <pattern id={`dense-${uid}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M4 0H0V4" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.6" />
        </pattern>
        <clipPath id={`clip-${uid}`}>
          <rect x={x0} y={y0} width={rw} height={rh} />
        </clipPath>
        <marker id={`arrow-${uid}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 1 L9 5 L0 9" fill="none" stroke="#f29f04" strokeWidth="1.4" />
        </marker>
      </defs>

      <rect width={VB_W} height={VB_H} fill={`url(#grid-${uid})`} className="text-foreground" />

      {/* floor */}
      <rect x={x0} y={y0} width={rw} height={rh} fill={fill ?? "rgba(242,159,4,0.06)"} />
      {tiles?.kind === "lines" ? (
        <path d={tiles.d} clipPath={`url(#clip-${uid})`} stroke="currentColor" strokeOpacity="0.28" strokeWidth="1" fill="none" className="text-foreground" />
      ) : tiles?.kind === "dense" ? (
        <rect x={x0} y={y0} width={rw} height={rh} fill={`url(#dense-${uid})`} className="text-foreground" />
      ) : null}
      <rect
        x={x0}
        y={y0}
        width={rw}
        height={rh}
        fill="none"
        stroke="#f29f04"
        strokeWidth="2"
        className="draw"
        pathLength={1}
        vectorEffect="non-scaling-stroke"
      />

      {/* measurement guides */}
      <g className="draw-fade text-foreground" fontSize="13" fontWeight="600">
        <line x1={x0} y1={y0 - 30} x2={x0 + rw} y2={y0 - 30} stroke="#f29f04" strokeWidth="1.2" markerStart={`url(#arrow-${uid})`} markerEnd={`url(#arrow-${uid})`} />
        <line x1={x0} y1={y0 - 38} x2={x0} y2={y0 - 6} stroke="currentColor" strokeOpacity="0.3" />
        <line x1={x0 + rw} y1={y0 - 38} x2={x0 + rw} y2={y0 - 6} stroke="currentColor" strokeOpacity="0.3" />
        <rect x={x0 + rw / 2 - 44} y={y0 - 42} width="88" height="24" rx="12" className="fill-background" stroke="#f29f04" strokeOpacity="0.5" />
        <text x={x0 + rw / 2} y={y0 - 26} textAnchor="middle" fill="currentColor" className="tabular">
          {fmt(L)}
        </text>

        <line x1={x0 - 30} y1={y0} x2={x0 - 30} y2={y0 + rh} stroke="#f29f04" strokeWidth="1.2" markerStart={`url(#arrow-${uid})`} markerEnd={`url(#arrow-${uid})`} />
        <line x1={x0 - 38} y1={y0} x2={x0 - 6} y2={y0} stroke="currentColor" strokeOpacity="0.3" />
        <line x1={x0 - 38} y1={y0 + rh} x2={x0 - 6} y2={y0 + rh} stroke="currentColor" strokeOpacity="0.3" />
        <g transform={`translate(${x0 - 30} ${y0 + rh / 2}) rotate(-90)`}>
          <rect x="-44" y="-12" width="88" height="24" rx="12" className="fill-background" stroke="#f29f04" strokeOpacity="0.5" />
          <text y="4.5" textAnchor="middle" fill="currentColor" className="tabular">
            {fmt(W)}
          </text>
        </g>

        <text x={x0 + rw / 2} y={y0 + rh / 2 + 6} textAnchor="middle" fill="currentColor" fontSize={rw > 150 && rh > 60 ? 20 : 13} fontWeight="700" opacity="0.85" className="tabular">
          {formatNumber(area, locale, 2)} m²
        </text>
      </g>

      {/* drag handles — keyboard accessible sliders */}
      {interactive ? (
        <g onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          {[
            { axis: "x" as const, cx: x0 + rw, cy: y0 + rh / 2, label: labels.length, value: L },
            { axis: "y" as const, cx: x0 + rw / 2, cy: y0 + rh, label: labels.width, value: W },
          ].map((h) => (
            <g
              key={h.axis}
              role="slider"
              tabIndex={0}
              aria-label={`${labels.handle} — ${h.label}`}
              aria-valuemin={0.5}
              aria-valuemax={maxM}
              aria-valuenow={h.value}
              aria-valuetext={fmt(h.value)}
              onPointerDown={start(h.axis)}
              onKeyDown={onKey(h.axis)}
              className="group cursor-grab outline-none active:cursor-grabbing"
              style={{ cursor: h.axis === "x" ? "ew-resize" : "ns-resize" }}
            >
              <circle cx={h.cx} cy={h.cy} r="22" fill="transparent" />
              <circle cx={h.cx} cy={h.cy} r="14" fill="#f29f04" opacity="0.18" className="transition-[r] group-hover:opacity-30 group-focus-visible:opacity-40" />
              <circle cx={h.cx} cy={h.cy} r="7.5" fill="#f29f04" stroke="#fff" strokeWidth="2.5" />
              <path
                d={h.axis === "x" ? `M${h.cx - 3} ${h.cy}h6` : `M${h.cx} ${h.cy - 3}v6`}
                stroke="#0d0d0d"
                strokeWidth="1.5"
              />
            </g>
          ))}
          <g onPointerDown={start("xy")} style={{ cursor: "nwse-resize" }} aria-hidden="true">
            <circle cx={x0 + rw} cy={y0 + rh} r="20" fill="transparent" />
            <rect x={x0 + rw - 6} y={y0 + rh - 6} width="12" height="12" fill="#0d0d0d" stroke="#f2b705" strokeWidth="2" transform={`rotate(45 ${x0 + rw} ${y0 + rh})`} />
          </g>
        </g>
      ) : null}
    </svg>
  )
}
