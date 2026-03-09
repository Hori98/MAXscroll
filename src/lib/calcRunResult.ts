import type { RunResult, SpinMeasurement } from './types'

export function calcRunResultFromMeasurement(measurement: SpinMeasurement): RunResult {
  const averageSpeedPxMs =
    measurement.durationMs > 0 ? measurement.normalizedDeltaTotal / measurement.durationMs : 0

  return {
    totalDeltaPx: measurement.normalizedDeltaTotal,
    averageSpeedPxMs,
    maxEventDeltaPx: measurement.maxSingleDelta,
  }
}
