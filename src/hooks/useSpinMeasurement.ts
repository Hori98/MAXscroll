import { useCallback, useEffect, useRef, useState } from 'react'

import { TRACKPAD_WINDOW_MS, WHEEL_WINDOW_MS } from '../lib/constants'
import { normalizeDelta } from '../lib/normalizeDelta'
import type { SpinMeasurement } from '../lib/types'

type UseSpinMeasurementArgs = {
  onComplete: (measurement: SpinMeasurement) => void
}

type SessionState = {
  startTs: number
  lastTs: number
  rawDeltaTotal: number
  normalizedDeltaTotal: number
  maxSingleDelta: number
  eventCount: number
  deltaMode: number
  trusted: boolean
  samples: number[]
}

const MIN_TOUCH_DELTA = 12
const MAX_TOUCH_DURATION_MS = 700

function variance(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
}

function getWindowMs(samples: number[]): number {
  if (samples.length < 3) return WHEEL_WINDOW_MS
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length
  const isTrackpadLike = mean < 25 && variance(samples) < 200
  return isTrackpadLike ? TRACKPAD_WINDOW_MS : WHEEL_WINDOW_MS
}

export function useSpinMeasurement({ onComplete }: UseSpinMeasurementArgs) {
  const [isListening, setIsListening] = useState(false)
  const sessionRef = useRef<SessionState | null>(null)
  const timerRef = useRef<number | null>(null)
  const touchStartRef = useRef<{ y: number; ts: number } | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const flush = useCallback(() => {
    const session = sessionRef.current
    if (!session) return

    const measurement: SpinMeasurement = {
      rawDeltaTotal: session.rawDeltaTotal,
      normalizedDeltaTotal: session.normalizedDeltaTotal,
      maxSingleDelta: session.maxSingleDelta,
      eventCount: session.eventCount,
      deltaMode: session.deltaMode,
      durationMs: Math.max(0, session.lastTs - session.startTs),
      trusted: session.trusted,
    }

    sessionRef.current = null
    clearTimer()
    setIsListening(false)
    onComplete(measurement)
  }, [clearTimer, onComplete])

  const onWheel = useCallback(
    (event: WheelEvent) => {
      if (!isListening) return
      if (!event.isTrusted) return

      event.preventDefault()

      const now = performance.now()
      const raw = Math.abs(event.deltaY)
      const normalized = normalizeDelta(event.deltaY, event.deltaMode)

      if (!sessionRef.current) {
        sessionRef.current = {
          startTs: now,
          lastTs: now,
          rawDeltaTotal: 0,
          normalizedDeltaTotal: 0,
          maxSingleDelta: 0,
          eventCount: 0,
          deltaMode: event.deltaMode,
          trusted: true,
          samples: [],
        }
      }

      const session = sessionRef.current
      session.lastTs = now
      session.rawDeltaTotal += raw
      session.normalizedDeltaTotal += normalized
      session.maxSingleDelta = Math.max(session.maxSingleDelta, raw)
      session.eventCount += 1
      session.samples.push(raw)

      clearTimer()
      timerRef.current = window.setTimeout(flush, getWindowMs(session.samples))
    },
    [clearTimer, flush, isListening],
  )

  const start = useCallback(() => {
    sessionRef.current = null
    touchStartRef.current = null
    clearTimer()
    setIsListening(true)
  }, [clearTimer])

  const stop = useCallback(() => {
    sessionRef.current = null
    touchStartRef.current = null
    clearTimer()
    setIsListening(false)
  }, [clearTimer])

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      if (!isListening || event.touches.length === 0 || !event.isTrusted) return
      touchStartRef.current = {
        y: event.touches[0].clientY,
        ts: performance.now(),
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!isListening) return
      event.preventDefault()
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (!isListening || !event.isTrusted) return
      const startPoint = touchStartRef.current
      if (!startPoint || event.changedTouches.length === 0) return

      const endY = event.changedTouches[0].clientY
      const durationMs = Math.max(1, performance.now() - startPoint.ts)
      const delta = Math.abs(startPoint.y - endY)
      if (delta < MIN_TOUCH_DELTA || durationMs > MAX_TOUCH_DURATION_MS) return

      const velocity = delta / durationMs
      const normalized = delta * 3.8 + velocity * 300

      touchStartRef.current = null
      setIsListening(false)
      onComplete({
        rawDeltaTotal: delta,
        normalizedDeltaTotal: normalized,
        maxSingleDelta: delta,
        eventCount: 1,
        deltaMode: 0,
        durationMs,
        trusted: true,
      })
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      clearTimer()
    }
  }, [clearTimer, isListening, onComplete, onWheel])

  return { isListening, start, stop }
}
