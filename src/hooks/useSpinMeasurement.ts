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
    clearTimer()
    setIsListening(true)
  }, [clearTimer])

  const stop = useCallback(() => {
    sessionRef.current = null
    clearTimer()
    setIsListening(false)
  }, [clearTimer])

  useEffect(() => {
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      clearTimer()
    }
  }, [clearTimer, onWheel])

  return { isListening, start, stop }
}
