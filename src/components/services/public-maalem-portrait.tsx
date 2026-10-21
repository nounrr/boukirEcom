'use client'

import Image from 'next/image'
import { useState } from 'react'

import { getMaalemInitials } from '@/components/service-requests/maalem-public-summary'

export function PublicMaalemPortrait({ src, name, sizes, priority = false, large = false, fallbackLabel }: {
  src: string | null
  name: string
  sizes: string
  priority?: boolean
  large?: boolean
  fallbackLabel?: string
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return <div className={`absolute inset-0 flex items-center justify-center bg-emerald-950 font-semibold tracking-tight text-emerald-100 ${large ? 'text-3xl sm:text-5xl lg:text-7xl' : 'text-2xl'}`} role="img" aria-label={fallbackLabel || name}>
      {getMaalemInitials(name)}
    </div>
  }

  return <Image src={src} alt={name} fill sizes={sizes} priority={priority} className="object-cover object-center" onError={() => setFailed(true)} />
}
