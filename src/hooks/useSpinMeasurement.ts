import { useCallback, useEffect, useRef, useState } from 'react'

import { normalizeDelta } from '../lib/normalizeDelta'
import type { SpinMeasurement, SpinMeasurementProgress } from '../lib/types'

type UseSpinMeasurementArgs = {
  onStart?: () => void
  onProgress?: (progress: SpinMeasurementProgress) => void
  onCancel?: () => void
  onComplete: (measurement: SpinMeasurement) => void
}

type SessionState = {
  startTs: number
  lastTs: number
  lastSignificantUpdateAt: number
  rawDeltaTotal: number
  normalizedDeltaTotal: number
  maxSingleDelta: number
  eventCount: number
  deltaMode: number
  trusted: boolean
  samples: number[]
}

const STOP_AFTER_MS = 1000
const SIGNIFICANT_DELTA_EPS = 0.8
const MIN_TOUCH_DELTA = 12
const MAX_TOUCH_DURATION_MS = 700

function variance(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
}

function inferWheelInputType(session: SessionState): { type: SpinMeasurement['inferredInputType']; confidence: number } {
  const dur = Math.max(1, session.lastTs - session.startTs)
  const sampleVariance = variance(session.samples)
  const mean = session.samples.reduce((sum, value) => sum + value, 0) / Math.max(1, session.samples.length)

  if (session.eventCount >= 7 && dur > 250 && mean > 30) {
    return { type: 'free-spin-wheel', confidence: 0.82 }
  }
  if (session.eventCount >= 4 && dur > 120 && mean < 35 && sampleVariance < 500) {
    return { type: 'trackpad', confidence: 0.84 }
  }
  if (session.eventCount <= 3 && mean >= 35) {
    return { type: 'mouse-wheel', confidence: 0.8 }
  }
  return { type: 'other', confidence: 0.5 }
}

function buildAnomalyFlags(args: {
  trusted: boolean
  durationMs: number
  normalizedDeltaTotal: number
  rawDeltaTotal: number
  eventCount: number
}): string[] {
  const flags: string[] = []
  if (!args.trusted) flags.push('untrusted_event')
  if (args.durationMs <= 0) flags.push('invalid_duration')
  if (args.durationMs < 6 && args.eventCount > 2) flags.push('impossible_burst')
  if (args.eventCount > 120) flags.push('excessive_events')
  if (args.normalizedDeltaTotal > 25000 || args.rawDeltaTotal > 9000) flags.push('extreme_delta')
  return flags
}

function calcTrustedScore(trusted: boolean, anomalyFlags: string[]): number {
  if (!trusted) return 0
  const score = 1 - anomalyFlags.length * 0.2
  return Math.max(0, Math.min(1, score))
}

export function useSpinMeasurement({ onStart, onProgress, onCancel, onComplete }: UseSpinMeasurementArgs) {
  const [isListening, setIsListening] = useState(false)
  const sessionRef = useRef<SessionState | null>(null)
  const timerRef = useRef<number | null>(null)
  const touchStartRef = useRef<{ y: number; ts: number; started: boolean } | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const buildProgress = useCallback((session: SessionState): SpinMeasurementProgress => {
    return {
      rawDeltaTotal: session.rawDeltaTotal,
      normalizedDeltaTotal: session.normalizedDeltaTotal,
      eventCount: session.eventCount,
      durationMs: Math.max(0, session.lastTs - session.startTs),
    }
  }, [])

  const flush = useCallback(() => {
    const session = sessionRef.current
    if (!session) return

    const durationMs = Math.max(0, session.lastTs - session.startTs)
    const inferred = inferWheelInputType(session)
    const anomalyFlags = buildAnomalyFlags({
      trusted: session.trusted,
      durationMs,
      normalizedDeltaTotal: session.normalizedDeltaTotal,
      rawDeltaTotal: session.rawDeltaTotal,
      eventCount: session.eventCount,
    })

    const measurement: SpinMeasurement = {
      rawDeltaTotal: session.rawDeltaTotal,
      normalizedDeltaTotal: session.normalizedDeltaTotal,
      maxSingleDelta: session.maxSingleDelta,
      eventCount: session.eventCount,
      deltaMode: session.deltaMode,
      durationMs,
      trusted: session.trusted,
      inferredInputType: inferred.type,
      inferenceConfidence: inferred.confidence,
      anomalyFlags,
      trustedScore: calcTrustedScore(session.trusted, anomalyFlags),
    }

    sessionRef.current = null
    clearTimer()
    setIsListening(false)
    onComplete(measurement)
  }, [clearTimer, onComplete])

  const scheduleFinalizeCheck = useCallback(() => {
    clearTimer()

    const runCheck = () => {
      const session = sessionRef.current
      if (!session) return

      const now = performance.now()
      const elapsedSinceSignificant = now - session.lastSignificantUpdateAt
      if (elapsedSinceSignificant >= STOP_AFTER_MS) {
        flush()
        return
      }

      const waitMs = STOP_AFTER_MS - elapsedSinceSignificant
      timerRef.current = window.setTimeout(runCheck, Math.max(8, waitMs))
    }

    timerRef.current = window.setTimeout(runCheck, STOP_AFTER_MS)
  }, [clearTimer, flush])

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
          lastSignificantUpdateAt: now,
          rawDeltaTotal: 0,
          normalizedDeltaTotal: 0,
          maxSingleDelta: 0,
          eventCount: 0,
          deltaMode: event.deltaMode,
          trusted: true,
          samples: [],
        }
        onStart?.()
      }

      const session = sessionRef.current
      session.lastTs = now
      session.rawDeltaTotal += raw
      session.normalizedDeltaTotal += normalized
      session.maxSingleDelta = Math.max(session.maxSingleDelta, raw)
      session.eventCount += 1
      session.samples.push(raw)
      if (raw >= SIGNIFICANT_DELTA_EPS) {
        session.lastSignificantUpdateAt = now
      }

      onProgress?.(buildProgress(session))
      scheduleFinalizeCheck()
    },
    [buildProgress, isListening, onProgress, onStart, scheduleFinalizeCheck],
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
        started: false,
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!isListening) return
      event.preventDefault()

      const startPoint = touchStartRef.current
      if (!startPoint || event.touches.length === 0 || !event.isTrusted) return

      const currentY = event.touches[0].clientY
      const delta = Math.abs(startPoint.y - currentY)
      if (!startPoint.started && delta >= MIN_TOUCH_DELTA) {
        startPoint.started = true
        onStart?.()
      }

      if (startPoint.started) {
        onProgress?.({
          rawDeltaTotal: delta,
          normalizedDeltaTotal: delta * 3.8,
          eventCount: 1,
          durationMs: Math.max(0, performance.now() - startPoint.ts),
        })
      }
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (!isListening || !event.isTrusted) return
      const startPoint = touchStartRef.current
      if (!startPoint || event.changedTouches.length === 0) return

      const endY = event.changedTouches[0].clientY
      const durationMs = Math.max(1, performance.now() - startPoint.ts)
      const delta = Math.abs(startPoint.y - endY)
      if (!startPoint.started || delta < MIN_TOUCH_DELTA || durationMs > MAX_TOUCH_DURATION_MS) {
        touchStartRef.current = null
        onCancel?.()
        return
      }

      const velocity = delta / durationMs
      const normalized = delta * 3.8 + velocity * 300
      const anomalyFlags = buildAnomalyFlags({
        trusted: true,
        durationMs,
        normalizedDeltaTotal: normalized,
        rawDeltaTotal: delta,
        eventCount: 1,
      })

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
        inferredInputType: 'touch',
        inferenceConfidence: 0.95,
        anomalyFlags,
        trustedScore: calcTrustedScore(true, anomalyFlags),
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
  }, [clearTimer, isListening, onCancel, onComplete, onProgress, onStart, onWheel])

  return { isListening, start, stop }
}
