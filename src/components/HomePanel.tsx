import { EnvironmentBadge } from './EnvironmentBadge'
import { EnvironmentEditor } from './EnvironmentEditor'
import type { DeclaredEnvironment, EnvironmentProfile, SavedRun } from '../lib/types'

type Props = {
  environment: EnvironmentProfile
  bestRun: SavedRun | null
  onLaunch: () => void
  onEnvironmentChange: (patch: Partial<DeclaredEnvironment>) => void
}

export function HomePanel({ environment, bestRun, onLaunch, onEnvironmentChange }: Props) {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-8 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Measurement Game</p>
      <h1 className="mt-3 font-mono text-5xl font-bold text-cyan-100 sm:text-6xl">SPIN LAUNCH</h1>
      <p className="mt-4 text-cyan-50/70">Scroll once. Fly far.</p>

      <button
        className="mt-8 rounded-2xl border border-accent/70 bg-accent/10 px-14 py-4 font-mono text-lg font-semibold text-accent shadow-neon transition hover:bg-accent/20"
        onClick={onLaunch}
        type="button"
      >
        LAUNCH
      </button>

      <div className="mt-4 h-6 text-sm text-cyan-100/80">Press launch to begin countdown.</div>

      {bestRun && (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-mono text-sm text-white/80">
          BEST: {bestRun.result.displayedDistanceMeters.toFixed(1)} m
        </div>
      )}

      <div className="mt-6">
        <EnvironmentBadge environment={environment} />
      </div>

      <EnvironmentEditor declared={environment.declared} onChange={onEnvironmentChange} />
    </section>
  )
}
