import { useCallback, useEffect, useRef, useState } from 'react'

import { TRACKPAD_WINDOW_MS, WHEEL_WINDOW_MS } from '../lib/constants'
import { normalizeDelta } from '../lib/normalizeDelta'
import type { InputType, SpinMeasurement, SpinMeasurementProgress } from '../lib/types'

type UseSpinMeasurementArgs = {
  onStart?: () => void
  onProgress?: (progress: SpinMeasurementProgress) => void
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
  intervals: number[]
}

const MIN_TOUCH_DELTA = 12
const MAX_TOUCH_DURATION_MS = 700
const MAX_WHEEL_MEASUREMENT_MS = 5000
const BASE_GRACE_MS = 200
const FREESPIN_GRACE_MS = 320
const LOW_TAIL_GRACE_BONUS_MS = 120
const MIN_SILENCE_MS = 260
const MAX_SILENCE_MS = 900

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

function inferWheelInputType(session: SessionState): { type: InputType; confidence: number } {
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
  if (args.eventCount > 80) flags.push('excessive_events')
  if (args.normalizedDeltaTotal > 25000 || args.rawDeltaTotal > 9000) flags.push('extreme_delta')
  return flags
}

function calcTrustedScore(trusted: boolean, anomalyFlags: string[]): number {
  if (!trusted) return 0
  const score = 1 - anomalyFlags.length * 0.2
  return Math.max(0, Math.min(1, score))
}

function tailAverage(samples: number[]): number {
  if (samples.length === 0) return 0
  const tail = samples.slice(-3)
  return tail.reduce((sum, value) => sum + value, 0) / tail.length
}

function deriveSilenceMs(session: SessionState): number {
  const inactivityMs = getWindowMs(session.samples)
  const inferred = inferWheelInputType(session)
  let graceMs = inferred.type === 'free-spin-wheel' ? FREESPIN_GRACE_MS : BASE_GRACE_MS
  if (tailAverage(session.samples) < 3) {
    graceMs += LOW_TAIL_GRACE_BONUS_MS
  }

  const avgInterval =
    session.intervals.length > 0
      ? session.intervals.reduce((sum, value) => sum + value, 0) / session.intervals.length
      : 16

  const adaptiveMs = avgInterval * 3 + graceMs
  return Math.max(MIN_SILENCE_MS, Math.min(MAX_SILENCE_MS, Math.max(inactivityMs + graceMs, adaptiveMs)))
}

export function useSpinMeasurement({ onStart, onProgress, onComplete }: UseSpinMeasurementArgs) {
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
    const runCheck = () => {
      clearTimer()
      const session = sessionRef.current
      if (!session) return

      const now = performance.now()
      const maxEndTs = session.startTs + MAX_WHEEL_MEASUREMENT_MS
      const silenceMs = deriveSilenceMs(session)
      const idleMs = now - session.lastTs

      if (now >= maxEndTs || idleMs >= silenceMs) {
        flush()
        return
      }

      const waitMs = Math.min(silenceMs - idleMs, maxEndTs - now)
      timerRef.current = window.setTimeout(runCheck, Math.max(8, waitMs))
    }

    runCheck()
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
          rawDeltaTotal: 0,
          normalizedDeltaTotal: 0,
          maxSingleDelta: 0,
          eventCount: 0,
          deltaMode: event.deltaMode,
          trusted: true,
          samples: [],
          intervals: [],
        }
        onStart?.()
      }

      const session = sessionRef.current
      const gap = now - session.lastTs
      if (gap > 0) {
        session.intervals.push(gap)
        if (session.intervals.length > 12) {
          session.intervals.shift()
        }
      }

      session.lastTs = now
      session.rawDeltaTotal += raw
      session.normalizedDeltaTotal += normalized
      session.maxSingleDelta = Math.max(session.maxSingleDelta, raw)
      session.eventCount += 1
      session.samples.push(raw)
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
      }
      onStart?.()
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
  }, [clearTimer, isListening, onComplete, onStart, onWheel])

  return { isListening, start, stop }
}
