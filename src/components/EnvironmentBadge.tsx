import type { EnvironmentProfile } from '../lib/types'

type Props = {
  environment: EnvironmentProfile
}

export function EnvironmentBadge({ environment }: Props) {
  return (
    <div className="rounded-xl border border-cyan-300/20 bg-black/30 px-3 py-2 text-xs text-cyan-100/80">
      <div>{`${environment.osName} / ${environment.browserName}`}</div>
      <div className="mt-1 text-[11px] text-cyan-100/60">
        {`${environment.viewportWidth}x${environment.viewportHeight} · ${environment.pointerType}`}
      </div>
      <div className="mt-1 text-[11px] text-cyan-100/60">
        {`${environment.inputType}${environment.deviceName ? ` · ${environment.deviceName}` : ''}`}
      </div>
    </div>
  )
}
