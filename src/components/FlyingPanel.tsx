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
  const layerNearRef = useRef<HTMLDivElement | null>(null)
  const layerFarRef = useRef<HTMLDivElement | null>(null)
  const objectRef = useRef<HTMLDivElement | null>(null)
  const distanceRef = useRef<HTMLDivElement | null>(null)
  const speedRef = useRef<HTMLDivElement | null>(null)

  const onFrame = useCallback((speedKmh: number, distanceMeters: number) => {
    const ratio = Math.min(1, Math.max(0, speedKmh / 600))
    const hueA = 200 - ratio * 80
    const hueB = 230 + ratio * 25
    if (containerRef.current) {
      containerRef.current.style.background = `radial-gradient(circle at 30% 20%, hsl(${hueA}, 70%, 20%) 0%, hsl(${hueB}, 65%, 10%) 52%, #020307 100%)`
    }

    const shiftFar = ratio * 18
    const shiftNear = ratio * 42
    if (layerFarRef.current) {
      layerFarRef.current.style.transform = `translate3d(0, ${shiftFar}px, 0)`
      layerFarRef.current.style.opacity = `${0.2 + ratio * 0.4}`
    }
    if (layerNearRef.current) {
      layerNearRef.current.style.transform = `translate3d(0, ${shiftNear}px, 0)`
      layerNearRef.current.style.opacity = `${0.15 + ratio * 0.35}`
    }

    if (objectRef.current) {
      const x = Math.min(65, distanceMeters * 0.08)
      const y = Math.sin(distanceMeters * 0.06) * 8
      const rot = 18 - ratio * 22
      objectRef.current.style.transform = `translate3d(${x}vw, ${y}px, 0) rotate(${rot}deg)`
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
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden transition-[background] duration-200"
    >
      <div
        ref={layerFarRef}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgba(60,167,255,0.45),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(56,242,184,0.2),transparent_40%)] transition-transform duration-150"
      />
      <div
        ref={layerNearRef}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(56,242,184,0.42),transparent_35%),radial-gradient(circle_at_35%_15%,rgba(60,167,255,0.35),transparent_30%)] transition-transform duration-100"
      />
      <div
        ref={objectRef}
        className="pointer-events-none absolute left-[8vw] top-1/2 z-10 font-mono text-3xl text-cyan-100 transition-transform duration-75"
      >
        ▶
      </div>

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
        {environment.detected.osName} / {environment.detected.browserName} / {environment.effective.inputType}
      </div>

      <div ref={distanceRef} className="relative z-10 font-mono text-6xl font-bold tracking-tight text-cyan-100 sm:text-8xl">
        0.0 m
      </div>
    </section>
  )
}
