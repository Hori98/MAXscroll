import { AdSenseSlot } from './AdSenseSlot'

type Props = {
  secondsLeft: number
  onContinue: () => void
}

export function InterstitialAd({ secondsLeft, onContinue }: Props) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined
  const slot = import.meta.env.VITE_ADSENSE_INTERSTITIAL_SLOT as string | undefined
  const canShowLiveAd = Boolean(client && slot)

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Sponsored Break</p>
      <div className="mt-4 w-full rounded-2xl border border-white/15 bg-black/30 p-6">
        {canShowLiveAd ? (
          <AdSenseSlot client={client!} slot={slot!} />
        ) : (
          <div className="rounded-xl border border-dashed border-cyan-200/30 bg-cyan-300/5 p-10 font-mono text-cyan-100/80">
            Set `VITE_ADSENSE_CLIENT` and `VITE_ADSENSE_INTERSTITIAL_SLOT` to enable live ads.
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-white/65">
        Continue in {secondsLeft}s
      </p>
      <button
        className="mt-5 rounded-xl border border-cyan-300/70 bg-cyan-300/10 px-8 py-3 font-mono text-cyan-100 transition hover:bg-cyan-300/20 disabled:opacity-50"
        disabled={secondsLeft > 0}
        onClick={onContinue}
        type="button"
      >
        CONTINUE
      </button>
    </section>
  )
}
