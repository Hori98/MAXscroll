import { useCallback, useRef } from 'react'

import { useFlightSimulation } from '../hooks/useFlightSimulation'
import type { EnvironmentProfile, RunResult, SpinMeasurement } from '../lib/types'

type Props = {
  environment: EnvironmentProfile
  measurement: SpinMeasurement
  onComplete: (result: RunResult) => void
}

export function FlyingPanel({ environment, measurement, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const distanceRef = useRef<HTMLDivElement | null>(null)
  const speedRef = useRef<HTMLDivElement | null>(null)

  const onFrame = useCallback((speedKmh: number) => {
    const ratio = Math.min(1, Math.max(0, speedKmh / 600))
    const hueA = 200 - ratio * 80
    const hueB = 230 + ratio * 25
    if (containerRef.current) {
      containerRef.current.style.background = `radial-gradient(circle at 30% 20%, hsl(${hueA}, 70%, 20%) 0%, hsl(${hueB}, 65%, 10%) 52%, #020307 100%)`
    }
  }, [])

  useFlightSimulation({
    measurement,
    distanceRef,
    speedRef,
    onFrame,
    onComplete,
  })

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen w-full items-center justify-center transition-[background] duration-200"
    >
      <div className="absolute left-6 top-6 rounded-md bg-black/35 px-3 py-2 font-mono text-xs text-cyan-100/80">
        Spin Power: {measurement.normalizedDeltaTotal.toFixed(1)}
      </div>

      <div className="absolute right-6 top-6 rounded-md bg-black/35 px-3 py-2 font-mono text-xs text-cyan-100/80">
        <div>Speed</div>
        <div ref={speedRef} className="mt-1 text-sm text-cyan-100">
          0.0 km/h
        </div>
      </div>

      <div className="absolute bottom-8 rounded-md bg-black/35 px-3 py-2 text-xs text-cyan-100/65">
        {environment.osName} / {environment.browserName} / {environment.pointerType}
      </div>

      <div ref={distanceRef} className="font-mono text-6xl font-bold tracking-tight text-cyan-100 sm:text-8xl">
        0.0 m
      </div>
    </section>
  )
}
