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
        {progress
          ? `${progress.normalizedDeltaTotal >= 0 ? '+' : ''}${progress.normalizedDeltaTotal.toFixed(0)}`
          : '+0'}{' '}
        px
      </div>
      <p className="mt-2 text-cyan-100/70">{hasTouch ? 'Swipe in progress...' : 'Scroll in progress...'}</p>
      <p className="mt-3 font-mono text-lg font-semibold text-red-400">
        Spins: {progress?.eventCount ?? 0}
      </p>
    </section>
  )
}
