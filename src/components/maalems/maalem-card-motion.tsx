'use client'

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import styles from './directory.module.css'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches
}
// React uses this same snapshot for SSR and the first hydration render.
// The real media preference is applied immediately after hydration and on changes.
const getServerReducedMotionSnapshot = () => false
const HOVER_DURATION_SECONDS = 0.3

/**
 * Light photo-to-glass hover, matching the supplied profile-card reference.
 * Content is unchanged and server rendered; only hover/focus state is client-side.
 */
export function MaalemCardMotion({ portrait, background, children }: {
  portrait: ReactNode
  background: ReactNode
  children: ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const reduceMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getServerReducedMotionSnapshot)
  const active = hovered || focused
  // Starts instantly on hover or focus, and takes precisely 300 ms to finish.
  // Reversing the pointer midway animates from the current progress.
  const progress = useMotionValue(0)
  useEffect(() => {
    if (reduceMotion) {
      progress.jump(active ? 1 : 0)
      return
    }
    const controls = animate(progress, active ? 1 : 0, {
      duration: HOVER_DURATION_SECONDS,
      ease: 'easeInOut',
    })
    return () => controls.stop()
  }, [active, progress, reduceMotion])
  // The inset portrait fades into the same photo used as a full-height backdrop.
  const portraitOpacity = useTransform(progress, [0, 0.75, 1], [1, 0.15, 0])
  const backgroundOpacity = useTransform(progress, [0, 0.45, 1], [0, 0.65, 1])
  const backdropClip = useTransform(progress, [0, 1], [
    'inset(0% 0% 38% 0% round 24px)',
    'inset(0% 0% 0% 0% round 24px)',
  ])
  const shadow = useTransform(progress, [0, 1], [
    '0 12px 28px -16px rgba(35, 42, 38, .18)',
    '0 18px 38px -18px rgba(35, 42, 38, .25)',
  ])

  return <motion.article
    className={styles.card}
    data-active={active ? 'true' : 'false'}
    style={{ boxShadow: shadow }}
    onPointerEnter={event => {
      if (event.pointerType === 'touch' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
      setHovered(true)
    }}
    onPointerLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
    }}
  >
    <motion.div className={styles.cardBackdrop} aria-hidden="true" style={{ opacity: backgroundOpacity, clipPath: reduceMotion ? undefined : backdropClip }}>
      <div className={styles.cardBackdropImage}>{background}</div>
      <div className={styles.cardShade} />
    </motion.div>
    <motion.div className={styles.cardPortrait} style={{ opacity: portraitOpacity }}>{portrait}</motion.div>
    <div className={styles.cardContent}>
      <motion.div className={styles.cardGlass} aria-hidden="true" style={{ opacity: progress }} />
      {children}
    </div>
  </motion.article>
}

