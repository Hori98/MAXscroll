import {
  DISTANCE_SCALE,
  DRAG,
  LAUNCH_COEFFICIENT,
  SPEED_SCALE,
  SPEED_THRESHOLD,
} from './constants'
import type { RunResult, SpinMeasurement } from './types'

export function calcRunResultFromMeasurement(measurement: SpinMeasurement): RunResult {
  const initialSpeed = measurement.normalizedDeltaTotal * LAUNCH_COEFFICIENT
  let speed = initialSpeed
  let maxSpeed = initialSpeed
  let distance = 0

  // Deterministic offline simulation so we can finish immediately after measurement ends.
  while (speed >= SPEED_THRESHOLD) {
    distance += speed * 16.67
    speed *= DRAG
    if (speed > maxSpeed) {
      maxSpeed = speed
    }
  }

  return {
    finalDistance: distance,
    maxSpeed,
    initialSpeed,
    displayedDistanceMeters: distance * DISTANCE_SCALE,
    displayedMaxSpeedKmh: maxSpeed * SPEED_SCALE,
  }
}
