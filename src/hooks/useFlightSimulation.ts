import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

import {
  DISTANCE_SCALE,
  DRAG,
  LAUNCH_COEFFICIENT,
  SPEED_SCALE,
  SPEED_THRESHOLD,
} from '../lib/constants'
import type { RunResult, SpinMeasurement } from '../lib/types'

type UseFlightSimulationArgs = {
  measurement: SpinMeasurement
  distanceRef: RefObject<HTMLDivElement | null>
  speedRef: RefObject<HTMLDivElement | null>
  onFrame?: (speedKmh: number) => void
  onComplete: (result: RunResult) => void
}

export function useFlightSimulation({
  measurement,
  distanceRef,
  speedRef,
  onFrame,
  onComplete,
}: UseFlightSimulationArgs) {
  const frameIdRef = useRef<number | null>(null)

  useEffect(() => {
    const initialSpeed = measurement.normalizedDeltaTotal * LAUNCH_COEFFICIENT
    let speed = initialSpeed
    let maxSpeed = initialSpeed
    let distance = 0
    let prev = performance.now()

    const tick = (now: number) => {
      const dt = Math.max(0, now - prev)
      prev = now

      distance += speed * dt
      const dragFactor = Math.pow(DRAG, dt / 16.67)
      speed *= dragFactor
      maxSpeed = Math.max(maxSpeed, speed)

      const meters = distance * DISTANCE_SCALE
      const kmh = speed * SPEED_SCALE

      if (distanceRef.current) {
        distanceRef.current.textContent = `${meters.toFixed(1)} m`
      }
      if (speedRef.current) {
        speedRef.current.textContent = `${Math.max(0, kmh).toFixed(1)} km/h`
      }
      onFrame?.(kmh)

      if (speed < SPEED_THRESHOLD) {
        onComplete({
          finalDistance: distance,
          maxSpeed,
          initialSpeed,
          displayedDistanceMeters: meters,
          displayedMaxSpeedKmh: maxSpeed * SPEED_SCALE,
        })
        return
      }

      frameIdRef.current = window.requestAnimationFrame(tick)
    }

    frameIdRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (frameIdRef.current !== null) {
        window.cancelAnimationFrame(frameIdRef.current)
      }
    }
  }, [distanceRef, measurement, onComplete, onFrame, speedRef])
}
