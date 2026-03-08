# SPIN LAUNCH Remediation Plan v1

## 1. Purpose

Address current issues in game start clarity, environment attribution, and anti-tamper robustness while keeping the app browser-first and playable.

## 2. SSOT for this project

- Data schema SSOT: `src/lib/types.ts`
- Measurement contract SSOT: `src/hooks/useSpinMeasurement.ts`
- State transition SSOT: `src/App.tsx`
- UI reuse SSOT: `src/components/*`

## 3. Scope

- Add explicit launch flow: `home -> countdown -> armed -> flying -> result -> interstitial`
- Split environment data into detected/inferred/declared/effective layers
- Improve input-device inference and confidence handling
- Strengthen client-side anomaly detection and trust scoring
- Keep localStorage backward compatibility

## 4. Data model redesign (MECE)

- `detected`: browser-observable values only (OS, browser, viewport, pointer, etc.)
- `inferred`: heuristic values from runtime behavior (input type + confidence)
- `declared`: user overrides (deviceName, inputType, scroll setting)
- `effective`: resolved values for UI/game comparison

Rules:
- Effective input type = declared input type when provided, else inferred input type.
- Device name is always declared-only.
- Detected values are read-only in UI.

## 5. Security and anti-tamper in web constraints

- Keep `isTrusted` checks
- Add anomaly flags for extreme delta, invalid duration, suspicious burst patterns
- Add `trustedScore` to each run for downstream ranking hygiene
- Preserve warning notes that browser-only anti-cheat is not absolute

## 6. UX launch flow

- On `LAUNCH`, enter countdown screen with 3/2/1
- After countdown, show `SCROLL` on armed screen
- Input is accepted only in armed state
- Any input before armed state is ignored

## 7. Implementation tasks

1. Refactor type definitions and add migration-safe storage adapters.
2. Implement countdown and armed panels and wire phase transitions.
3. Extend measurement hook with inference confidence and anomaly flags.
4. Update home/result/flying UI to show detected/inferred/declared/effective cleanly.
5. Ensure share/save payloads include trust metadata.
6. Run lint/build and manual acceptance checks.

## 8. Validation checklist

- Launch always shows 3/2/1 then SCROLL.
- Game starts only after SCROLL is visible.
- Effective input type resolves correctly with/without manual override.
- Existing users with old localStorage do not crash.
- Anomaly flags appear for obviously invalid patterns.
- No flicker, overlay residue, double transition, or stuck input state.

## 9. Rollback plan

- Keep old storage read compatibility.
- Keep phase reducer simple so countdown/armed can be bypassed quickly if needed.
- Limit changes to local modules to avoid cross-cutting failures.

## 10. Self-review (Do/Don't)

Do:
- Check schema/state consistency before implementation.
- Keep state updates single-source per transition.
- Verify both success and failure paths.

Don't:
- Introduce unscoped temporary debug flags.
- Mix detected and declared data in one mutable object.
- Break backward compatibility of stored runs.
