'use client'

import Image from 'next/image'
import { useState } from 'react'
import styles from './directory.module.css'

/** Keeps a missing or rejected public image from leaving a broken portrait. */
export function MaalemCardPortrait({ src, name, initials, fallbackLabel, expanded = false }: {
  src: string | null
  name: string
  initials: string
  fallbackLabel: string
  expanded?: boolean
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || failedSrc === src) {
    return <div className={styles.initials} style={{ position: 'absolute', inset: 0 }} role={expanded ? undefined : 'img'} aria-label={expanded ? undefined : `${name} — ${fallbackLabel}`}>
      {initials}
    </div>
  }
  return <Image
    src={src}
    alt={expanded ? '' : name}
    fill
    sizes="(max-width: 540px) 100vw, (max-width: 800px) 50vw, 33vw"
    className={expanded ? styles.cardExpandedPhoto : styles.cardPhoto}
    onError={() => setFailedSrc(src)}
  />
}
