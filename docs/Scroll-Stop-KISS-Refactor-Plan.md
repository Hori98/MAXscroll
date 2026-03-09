# Scroll Stop Refactor Plan (KISS/DRY)

## 0. Goal

Fix the core UX bug:
- Measurement should end when scrolling has actually stopped.
- After stop is detected, transition to Result Hub after about 1 second.
- No hidden hard timeout should end runs while the wheel is still active.

## 1. Problem Summary

Observed issues:
- Premature end during ongoing wheel inertia.
- Stuck Measuring state in some paths.
- Overly complex stop logic with too many heuristics and timer interactions.

Root cause pattern:
- Stop detection logic is over-engineered (multiple adaptive branches + recursive timing checks), making behavior non-deterministic and hard to reason about.

## 2. Non-Negotiable Rules

1. KISS:
- End condition must be expressed as a single clear rule based on value updates.

2. DRY:
- One stop-decision function only.
- No duplicated stop conditions spread between wheel/touch paths.

3. Deterministic behavior:
- Same input pattern should produce same stop timing.

## 3. Target Design

### 3.1 Single stop rule

Use one source of truth:
- `lastSignificantUpdateAt` (timestamp)

Definition:
- Significant update means delta magnitude >= `SIGNIFICANT_DELTA_EPS`.

Stop condition:
- `now - lastSignificantUpdateAt >= STOP_AFTER_MS`

Constants:
- `STOP_AFTER_MS = 1000`
- `SIGNIFICANT_DELTA_EPS = 0.8` (tunable)

### 3.2 State model

- `home -> countdown -> armed -> measuring -> result -> interstitial -> home`
- Only `onStart` enters measuring.
- Only `onComplete` or `onCancel` exits measuring.

### 3.3 No hidden hard cutoff

Remove or disable max measurement timeout for wheel.
If needed for safety, it must be:
- extremely high,
- logged,
- and never part of normal behavior.

## 4. Implementation Steps

1. Replace stop logic in `useSpinMeasurement` with a single stop function:
- `shouldFinalize(now, lastSignificantUpdateAt)`.

2. Introduce significance filter:
- Update `lastSignificantUpdateAt` only when event delta >= epsilon.
- Tiny tail noise should not indefinitely postpone completion.

3. Unify timer scheduling:
- One timer path, one callback path.
- Callback always re-checks current condition before finalize.

4. Keep touch flow aligned:
- touch uses same stop semantics where applicable.
- ensure cancel path returns to `armed` reliably.

5. Keep Result Hub transition unchanged:
- on finalize -> compute result -> result hub.

## 5. Verification Checklist

### 5.1 Success paths
- Normal wheel notch: ends roughly 1s after final significant movement.
- Free-spin wheel: does not end mid-inertia; ends after actual stop + ~1s.
- Result Hub always appears after stop.

### 5.2 Failure paths
- Tiny jitter tail does not keep measuring forever.
- Tap-only touch does not get stuck in measuring.
- Share failure does not crash UI.

### 5.3 Regression checks
- Home -> launch -> countdown -> armed flow unchanged.
- Replay/Home buttons still work from Result Hub.
- localStorage parse still safe with malformed values.

## 6. Rollback

If regression appears:
1. Revert stop logic file only (`useSpinMeasurement.ts`).
2. Keep Result Hub and data model changes intact.
3. Restore previous stable tag/commit for measurement only.

## 7. Definition of Done

- Stop logic is understandable in under 2 minutes from code reading.
- No premature 2s cutoff while wheel is still active.
- No infinite measuring after wheel visibly stopped.
- Result Hub transition is reliable.
