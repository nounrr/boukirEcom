'use client'

import { useCallback, useEffect, useState } from 'react'

import type { CarouselApi } from '@/components/ui/carousel'

type CarouselRuntimeState = {
  isScrollable: boolean | null
  isLooping: boolean
}

const INITIAL_RUNTIME_STATE: CarouselRuntimeState = {
  isScrollable: null,
  isLooping: false,
}

/**
 * Embla can silently disable `loop` when the rendered slides are not wide
 * enough. Read the engine state after every re-initialisation instead of
 * guessing from a fixed item count.
 */
export function useCarouselRuntimeState(api: CarouselApi | null) {
  const [state, setState] = useState<CarouselRuntimeState>(INITIAL_RUNTIME_STATE)

  const updateState = useCallback(() => {
    if (!api) return

    const nextState = {
      isScrollable: api.canScrollPrev() || api.canScrollNext(),
      isLooping: api.internalEngine().options.loop,
    }

    setState((current) =>
      current.isScrollable === nextState.isScrollable &&
      current.isLooping === nextState.isLooping
        ? current
        : nextState
    )
  }, [api])

  useEffect(() => {
    if (!api) {
      setState(INITIAL_RUNTIME_STATE)
      return
    }

    updateState()
    api.on('select', updateState)
    api.on('reInit', updateState)

    return () => {
      api.off('select', updateState)
      api.off('reInit', updateState)
    }
  }, [api, updateState])

  return state
}

/**
 * Schedules the next slide only after the previous movement has settled.
 * When Embla falls back to a finite carousel, playback stops at the last
 * slide instead of keeping a useless interval alive.
 */
export function useCarouselAutoplay({
  api,
  delay,
  enabled,
  paused,
}: {
  api: CarouselApi | null
  delay: number
  enabled: boolean
  paused: boolean
}) {
  useEffect(() => {
    if (!api || !enabled || paused) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timeoutId: number | null = null
    let disposed = false

    const clearTimer = () => {
      if (timeoutId === null) return
      window.clearTimeout(timeoutId)
      timeoutId = null
    }

    const canAdvance = () =>
      api.internalEngine().options.loop || api.canScrollNext()

    const scheduleNext = () => {
      clearTimer()

      if (
        disposed ||
        document.hidden ||
        mediaQuery.matches ||
        api.scrollSnapList().length < 2 ||
        !canAdvance()
      ) {
        return
      }

      timeoutId = window.setTimeout(() => {
        timeoutId = null
        if (!disposed && canAdvance()) api.scrollNext()
      }, delay)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) clearTimer()
      else scheduleNext()
    }

    const handleMotionPreferenceChange = () => {
      if (mediaQuery.matches) clearTimer()
      else scheduleNext()
    }

    api.on('pointerDown', clearTimer)
    api.on('pointerUp', scheduleNext)
    api.on('select', clearTimer)
    api.on('settle', scheduleNext)
    api.on('reInit', scheduleNext)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    mediaQuery.addEventListener('change', handleMotionPreferenceChange)
    scheduleNext()

    return () => {
      disposed = true
      clearTimer()
      api.off('pointerDown', clearTimer)
      api.off('pointerUp', scheduleNext)
      api.off('select', clearTimer)
      api.off('settle', scheduleNext)
      api.off('reInit', scheduleNext)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      mediaQuery.removeEventListener('change', handleMotionPreferenceChange)
    }
  }, [api, delay, enabled, paused])
}
