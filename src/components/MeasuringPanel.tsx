import type { SpinMeasurementProgress } from '../lib/types'

type Props = {
  progress: SpinMeasurementProgress | null
  hasTouch: boolean
}

export function MeasuringPanel({ progress, hasTouch }: Props) {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Measuring Input</p>
      <div className="mt-6 font-mono text-5xl font-bold text-cyan-100 sm:text-6xl">
        {progress ? progress.normalizedDeltaTotal.toFixed(1) : '0.0'}
      </div>
      <p className="mt-2 text-cyan-100/70">{hasTouch ? 'Swipe in progress...' : 'Scroll in progress...'}</p>

      <div className="mt-8 grid w-full max-w-md gap-2 rounded-xl border border-white/10 bg-black/30 p-4 text-left text-sm text-white/80">
        <div>Raw Delta: {progress ? progress.rawDeltaTotal.toFixed(1) : '0.0'}</div>
        <div>Normalized Delta: {progress ? progress.normalizedDeltaTotal.toFixed(1) : '0.0'}</div>
        <div>Event Count: {progress?.eventCount ?? 0}</div>
        <div>Duration: {progress ? `${progress.durationMs.toFixed(0)} ms` : '0 ms'}</div>
      </div>
    </section>
  )
}
