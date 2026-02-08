"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"

import styles from "./order-confirmation-animation.module.css"

type OrderConfirmationAnimationStatus = "processing" | "success"

type Phase = "processing" | "success-1" | "success-2"

type Props = {
  open: boolean
  status: OrderConfirmationAnimationStatus
  onComplete?: () => void
}

export default function OrderConfirmationAnimation({ open, status, onComplete }: Props) {
  const t = useTranslations("checkout")
  const tCommon = useTranslations("common")

  const [phase, setPhase] = useState<Phase>("processing")
  const ranSuccessRef = useRef(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const label = useMemo(() => {
    if (status === "success") {
      return {
        title: tCommon("success"),
        subtitle: t("page.subtitle"),
      }
    }

    return {
      title: t("loading.title"),
      subtitle: t("loading.subtitle"),
    }
  }, [status, t, tCommon])

  useEffect(() => {
    if (!open) {
      ranSuccessRef.current = false
      setPhase("processing")
      return
    }

    if (status === "processing") {
      ranSuccessRef.current = false
      setPhase("processing")
      return
    }

    if (status === "success" && !ranSuccessRef.current) {
      ranSuccessRef.current = true
      setPhase("success-1")

      const t1 = window.setTimeout(() => setPhase("success-2"), 1600)
      const t2 = window.setTimeout(() => onComplete?.(), 4600)

      return () => {
        window.clearTimeout(t1)
        window.clearTimeout(t2)
      }
    }
  }, [open, status, onComplete])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
    panelRef.current?.focus()

    return () => {
      document.documentElement.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={status === "success" ? tCommon("success") : t("loading.title")}
    >
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />

      <div className={styles.panel} ref={panelRef} tabIndex={-1}>
        <div className={styles.panelInner}>
          <div className={styles.scene} data-phase={phase}>
            <span className={styles.box} aria-hidden="true" />

            <div className={styles.truck} aria-hidden="true">
              <div className={styles.truckBody}>
                <span className={`${styles.wheel} ${styles.wheelLeft}`} />
                <span className={`${styles.wheel} ${styles.wheelRight}`} />
              </div>
              <div className={styles.truckCab} />
            </div>

            <span className={styles.road} aria-hidden="true" />
          </div>

          <div className={styles.labelRow}>
            <div>
              <div className={styles.title}>{label.title}</div>
              <div className={styles.subtitle}>{label.subtitle}</div>
            </div>

            {status === "success" ? <span className={styles.check} /> : <span className={styles.spinner} />}
          </div>
        </div>
      </div>
    </div>
  )
}
