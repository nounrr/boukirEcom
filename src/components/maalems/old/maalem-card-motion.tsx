'use client'

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
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

/**
 * Original interaction inspired by Profile Card, Tran Mau Tri Tam:
 * https://www.figma.com/community/file/1505853580184938911/profile-card
 * Only this shell is client-side; the profile and its data remain server rendered.
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
  // Critically damped: reversals retain the current presentation and velocity.
  const progress = useSpring(0, { stiffness: 340, damping: 37, mass: 1 })
  useEffect(() => {
    if (reduceMotion) progress.jump(active ? 1 : 0)
    else progress.set(active ? 1 : 0)
  }, [active, progress, reduceMotion])
  const lift = useTransform(progress, [0, 1], [0, -7])
  const scale = useTransform(progress, [0, 1], [1, 1.012])
  const portraitOpacity = useTransform(progress, [0, .7, 1], [1, 0, 0])
  const imageScale = useTransform(progress, [0, 1], [1.07, 1])
  const imageClip = useTransform(progress, [0, 1], [
    'inset(0% 0% 46% 0% round 24px)',
    'inset(0% 0% 0% 0% round 24px)',
  ])
  const shadow = useTransform(progress, [0, 1], [
    '0 3px 6px -3px rgba(27,34,25,.08), 0 15px 32px -20px rgba(27,34,25,.25)',
    '0 7px 16px -6px rgba(27,34,25,.16), 0 32px 52px -18px rgba(27,34,25,.4)',
  ])

  return <motion.article
    className={styles.card}
    data-active={active ? 'true' : 'false'}
    style={{ y: reduceMotion ? 0 : lift, scale: reduceMotion ? 1 : scale, boxShadow: shadow }}
    onPointerEnter={event => {
      if (event.pointerType !== 'touch' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) setHovered(true)
    }}
    onPointerLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
    }}
  >
    <motion.div className={styles.cardBackdrop} aria-hidden="true" style={{ opacity: progress, clipPath: reduceMotion ? undefined : imageClip }}>
      <motion.div className={styles.cardBackdropImage} style={{ scale: reduceMotion ? 1 : imageScale }}>{background}</motion.div>
      <div className={styles.cardShade} />
    </motion.div>
    <motion.div className={styles.cardPortrait} style={{ opacity: portraitOpacity }}>{portrait}</motion.div>
    <div className={styles.cardContent}>
      <motion.div className={styles.cardGlass} aria-hidden="true" style={{ opacity: progress }} />
      {children}
    </div>
  </motion.article>
}
