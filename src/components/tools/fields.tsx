"use client"

import { Info, Minus, Plus } from "lucide-react"
import { useId } from "react"
import { parseDecimal, round } from "@/lib/calculators/core"
import { cn } from "@/lib/utils"

function decimalsOf(step: number) {
  const s = String(step)
  return s.includes(".") ? s.split(".")[1].length : 0
}

/** Formats a number for an editable input using the locale's decimal mark. */
export function toInput(value: number, locale: string) {
  const text = String(value)
  return locale === "fr" ? text.replace(".", ",") : text
}

export function NumberField({
  label,
  unit,
  value,
  onChange,
  step = 1,
  slider,
  presets,
  error,
  help,
  optional,
  optionalLabel,
  locale,
  className,
}: {
  label: string
  unit?: string
  value: string
  onChange: (next: string) => void
  step?: number
  slider?: [number, number]
  presets?: number[]
  error?: string
  help?: string
  optional?: boolean
  optionalLabel?: string
  locale: string
  className?: string
}) {
  const id = useId()
  const numeric = parseDecimal(value)
  const dec = decimalsOf(step)

  const bump = (direction: 1 | -1) => {
    const base = numeric ?? 0
    const next = round(Math.max(0, base + direction * step), dec)
    onChange(toInput(next, locale))
  }

  return (
    <div className={cn("group/field", className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-foreground/85">
          {label}
          {optional && optionalLabel ? <span className="ms-1.5 text-xs font-normal text-muted-foreground">({optionalLabel})</span> : null}
        </label>
        {unit ? <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground tabular">{unit}</span> : null}
      </div>
      <div
        className={cn(
          "flex h-12 items-center rounded-xl border bg-surface transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(242,159,4,0.15)]",
          error ? "border-destructive" : "border-input"
        )}
      >
        <button
          type="button"
          onClick={() => bump(-1)}
          className="grid h-full w-11 shrink-0 place-items-center rounded-s-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`− ${label}`}
          tabIndex={-1}
        >
          <Minus className="size-4" />
        </button>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault()
              bump(1)
            } else if (e.key === "ArrowDown") {
              e.preventDefault()
              bump(-1)
            }
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={[error ? `${id}-err` : null, help ? `${id}-help` : null].filter(Boolean).join(" ") || undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-center text-lg font-semibold tabular outline-none"
        />
        <button
          type="button"
          onClick={() => bump(1)}
          className="grid h-full w-11 shrink-0 place-items-center rounded-e-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`+ ${label}`}
          tabIndex={-1}
        >
          <Plus className="size-4" />
        </button>
      </div>
      {slider ? (
        <input
          type="range"
          min={slider[0]}
          max={slider[1]}
          step={step}
          value={Math.min(slider[1], Math.max(slider[0], numeric ?? slider[0]))}
          onChange={(e) => onChange(toInput(Number(e.target.value), locale))}
          aria-label={label}
          tabIndex={-1}
          className="mt-3 h-1.5 w-full cursor-pointer accent-[var(--primary)]"
        />
      ) : null}
      {presets?.length ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {presets.map((preset) => {
            const active = numeric === preset
            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(toInput(preset, locale))}
                aria-pressed={active}
                className={cn(
                  "h-7 rounded-full border px-2.5 text-xs font-semibold tabular transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {toInput(preset, locale)} {unit}
              </button>
            )
          })}
        </div>
      ) : null}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {help ? (
        <p id={`${id}-help`} className="mt-1.5 flex gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {help}
        </p>
      ) : null}
    </div>
  )
}

export function ChoiceField({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (next: string) => void
  className?: string
}) {
  const id = useId()
  return (
    <fieldset className={className}>
      <legend id={id} className="mb-2 text-[13px] font-medium text-foreground/85">
        {label}
      </legend>
      <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => {
                if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return
                e.preventDefault()
                const index = options.findIndex((o) => o.value === value)
                const forward = e.key === "ArrowRight" || e.key === "ArrowDown"
                const next = options[(index + (forward ? 1 : -1) + options.length) % options.length]
                onChange(next.value)
                const parent = e.currentTarget.parentElement
                window.setTimeout(() => parent?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus(), 0)
              }}
              tabIndex={active ? 0 : -1}
              className={cn(
                "min-h-10 rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-[background-color,border-color,color] duration-200",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-foreground/75 hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4">
      <label htmlFor={id} className="text-[13px] font-medium text-foreground/85">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-primary" : "bg-input")}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300 ease-[var(--ease-premium)]",
            checked ? "translate-x-[22px] rtl:-translate-x-[22px]" : "translate-x-0.5 rtl:-translate-x-0.5"
          )}
          style={{ insetInlineStart: 0 }}
        />
      </button>
    </div>
  )
}
