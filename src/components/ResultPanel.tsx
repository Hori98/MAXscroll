import { EnvironmentBadge } from './EnvironmentBadge'
import type { EnvironmentProfile, RunResult, SavedRun } from '../lib/types'

type Props = {
  environment: EnvironmentProfile
  result: RunResult
  previousRun: SavedRun | null
  isNewBest: boolean
  onRetry: () => void
  onBackHome: () => void
  onShare: () => void
  shareState: 'idle' | 'done' | 'error'
}

export function ResultPanel({
  environment,
  result,
  previousRun,
  isNewBest,
  onRetry,
  onBackHome,
  onShare,
  shareState,
}: Props) {
  const diffMeters = previousRun
    ? result.displayedDistanceMeters - previousRun.result.displayedDistanceMeters
    : null

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">Result Hub</p>
      <h2 className="mt-3 font-mono text-6xl font-bold text-cyan-100 sm:text-7xl">
        {result.displayedDistanceMeters.toFixed(1)} m
      </h2>
      {isNewBest && <p className="mt-2 font-mono text-lg text-accent">NEW BEST!</p>}

      <div className="mt-8 grid w-full gap-2 rounded-xl border border-white/10 bg-black/30 p-4 text-left text-sm text-white/80">
        <div>Max Speed: {result.displayedMaxSpeedKmh.toFixed(1)} km/h</div>
        <div>
          Diff vs Previous:{' '}
          {diffMeters === null ? '-' : `${diffMeters >= 0 ? '+' : ''}${diffMeters.toFixed(1)} m`}
        </div>
        <div>Input: {environment.effective.inputType}</div>
        <div>Device: {environment.effective.deviceName || '-'}</div>
      </div>

      <div className="mt-6">
        <EnvironmentBadge environment={environment} />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          className="rounded-xl border border-cyan-300/70 bg-cyan-300/10 px-8 py-3 font-mono text-cyan-100 transition hover:bg-cyan-300/20"
          onClick={onRetry}
          type="button"
        >
          REPLAY
        </button>
        <button
          className="rounded-xl border border-white/35 bg-white/5 px-6 py-3 font-mono text-white/85 transition hover:bg-white/15"
          onClick={onShare}
          type="button"
        >
          {shareState === 'done' ? 'COPIED' : shareState === 'error' ? 'SHARE FAILED' : 'SHARE'}
        </button>
        <button
          className="rounded-xl border border-white/35 bg-white/5 px-6 py-3 font-mono text-white/85 transition hover:bg-white/15"
          onClick={onBackHome}
          type="button"
        >
          HOME
        </button>
      </div>
    </section>
  )
}
