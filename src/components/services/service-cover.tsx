'use client'

import Image from 'next/image'
import { Wrench } from 'lucide-react'
import { useState } from 'react'

export function ServiceCover({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <div className="flex h-40 items-center gap-4 rounded-md bg-muted/60 px-6 sm:h-48" role="img" aria-label={name}>
      <Wrench className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="text-lg font-medium text-muted-foreground">{name}</span>
    </div>
  }
  return <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-muted">
    <Image src={src} alt={name} fill priority sizes="(max-width:1023px) 100vw,70vw" className="object-cover" onError={() => setFailed(true)} />
  </div>
}
