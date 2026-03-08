import type { EnvironmentProfile } from '../lib/types'

type Props = {
  environment: EnvironmentProfile
}

export function EnvironmentBadge({ environment }: Props) {
  const detected = environment.detected
  const inferred = environment.inferred
  const declared = environment.declared
  const effective = environment.effective

  return (
    <div className="rounded-xl border border-cyan-300/20 bg-black/30 px-3 py-2 text-xs text-cyan-100/80">
      <div>{`${detected.osName} / ${detected.browserName}`}</div>
      <div className="mt-1 text-[11px] text-cyan-100/60">
        {`${detected.viewportWidth}x${detected.viewportHeight} · ${detected.pointerType}`}
      </div>
      <div className="mt-1 text-[11px] text-cyan-100/60">
        inferred: {inferred.inputType} ({Math.round(inferred.confidence * 100)}%)
      </div>
      <div className="mt-1 text-[11px] text-cyan-100/60">
        declared: {declared.inputType ?? '-'} {declared.deviceName ? `· ${declared.deviceName}` : ''}
      </div>
      <div className="mt-1 text-[11px] text-cyan-100/70">effective: {effective.inputType}</div>
    </div>
  )
}
