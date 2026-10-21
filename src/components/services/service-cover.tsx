'use client'

import Image from 'next/image'
import { Wrench } from 'lucide-react'
import { useState } from 'react'

/**
 * `cover` : bandeau 16/9 classique.
 * `thumb` : remplit son parent (qui porte la taille et l'arrondi), pour la vignette
 * en debord du hero. Le repli image cassee reste gere dans les deux cas.
 */
export function ServiceCover({ src, name, variant = 'cover' }: {
  src: string | null
  name: string
  variant?: 'cover' | 'thumb'
}) {
  const [failed, setFailed] = useState(false)
  const isThumb = variant === 'thumb'

  if (!src || failed) {
    return isThumb ? (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-emerald-950 p-8 text-center text-emerald-100" role="img" aria-label={name}>
        <Wrench className="size-8 text-emerald-200 lg:size-12" aria-hidden="true" />
        <span className="hidden max-w-sm text-xl font-medium leading-snug lg:block">{name}</span>
      </div>
    ) : (
      <div className="flex h-40 items-center gap-4 rounded-md bg-muted/60 px-6 sm:h-48" role="img" aria-label={name}>
        <Wrench className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-lg font-medium text-muted-foreground">{name}</span>
      </div>
    )
  }

  if (isThumb) {
    return <Image src={src} alt={name} fill priority sizes="(min-width: 1024px) 256px, (min-width: 640px) 176px, 96px" className="object-cover" onError={() => setFailed(true)} />
  }

  return <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-muted">
    <Image src={src} alt={name} fill priority sizes="(max-width:1023px) 100vw,70vw" className="object-cover" onError={() => setFailed(true)} />
  </div>
}
