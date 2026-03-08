import type { EnvironmentProfile, InputType } from '../lib/types'

type Props = {
  environment: EnvironmentProfile
  onChange: (patch: Partial<EnvironmentProfile>) => void
}

const inputOptions: InputType[] = [
  'mouse-wheel',
  'free-spin-wheel',
  'trackpad',
  'magic-mouse',
  'touch',
  'other',
]

export function EnvironmentEditor({ environment, onChange }: Props) {
  return (
    <div className="mt-6 w-full max-w-xl rounded-xl border border-cyan-300/15 bg-black/30 p-4 text-left">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">Environment Profile</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-cyan-100/80">
          Input Type
          <select
            className="mt-1 w-full rounded-md border border-cyan-300/30 bg-black/40 px-2 py-2 text-sm text-cyan-100"
            onChange={(event) => onChange({ inputType: event.target.value as InputType })}
            value={environment.inputType}
          >
            {inputOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-cyan-100/80">
          Scroll Setting
          <select
            className="mt-1 w-full rounded-md border border-cyan-300/30 bg-black/40 px-2 py-2 text-sm text-cyan-100"
            onChange={(event) =>
              onChange({ scrollSettingType: event.target.value as EnvironmentProfile['scrollSettingType'] })
            }
            value={environment.scrollSettingType}
          >
            <option value="default">default</option>
            <option value="custom">custom</option>
            <option value="unknown">unknown</option>
          </select>
        </label>
      </div>

      <label className="mt-3 block text-xs text-cyan-100/80">
        Device Name
        <input
          className="mt-1 w-full rounded-md border border-cyan-300/30 bg-black/40 px-2 py-2 text-sm text-cyan-100 placeholder:text-cyan-100/35"
          maxLength={48}
          onChange={(event) => onChange({ deviceName: event.target.value })}
          placeholder="MX Master 3S / Magic Trackpad"
          value={environment.deviceName}
        />
      </label>
    </div>
  )
}
