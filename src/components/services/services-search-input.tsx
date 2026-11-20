'use client'

import { Search } from 'lucide-react'
import { useRef } from 'react'

import { SearchMediaButtons } from '@/components/layout/search-media-buttons'

/**
 * Search field of /services (inside its GET form): typed text, voice, or a photo of the problem.
 * After voice or photo, the words are written in the field and the form is sent.
 */
export function ServicesSearchInput({ defaultValue, placeholder }: { defaultValue: string; placeholder: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const fill = (text: string) => {
    if (inputRef.current) inputRef.current.value = text
  }
  return (
    <span className="relative">
      <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-accent-text" aria-hidden="true" />
      <input
        ref={inputRef}
        suppressHydrationWarning
        type="search"
        name="q"
        defaultValue={defaultValue}
        maxLength={100}
        placeholder={placeholder}
        className="h-12 w-full rounded-full border border-border bg-background ps-11 pe-24 text-sm font-normal normal-case tracking-normal text-foreground outline-none transition focus:border-brand-orange/70 focus:shadow-[0_0_0_4px_rgba(242,159,4,0.15)]"
      />
      <span className="absolute end-2 top-1/2 flex -translate-y-1/2 items-center normal-case tracking-normal">
        <SearchMediaButtons
          tone="panel"
          onInterim={fill}
          onQuery={(text) => {
            fill(text)
            inputRef.current?.form?.requestSubmit()
          }}
        />
      </span>
    </span>
  )
}
