import { makeEnvironmentProfile } from './getEnvironment'
import type {
  DeclaredEnvironment,
  EnvironmentProfile,
  SavedRun,
  SpinMeasurement,
  InputType,
  DetectedEnvironment,
} from './types'

const BEST_KEY = 'spinlaunch_best'
const LATEST_KEY = 'spinlaunch_latest'
const ENV_KEY = 'spinlaunch_env'

type LegacyEnvironment = {
  osName?: string
  browserName?: string
  screenWidth?: number
  screenHeight?: number
  viewportWidth?: number
  viewportHeight?: number
  devicePixelRatio?: number
  platform?: string
  language?: string
  timezone?: string
  hasTouch?: boolean
  pointerType?: 'fine' | 'coarse' | 'unknown'
  inputType?: InputType
  deviceName?: string
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function toDeclaredEnvironment(input: unknown): DeclaredEnvironment | null {
  if (!input || typeof input !== 'object') return null
  const value = input as Partial<DeclaredEnvironment> & LegacyEnvironment

  if ('declared' in (input as Record<string, unknown>)) {
    const declared = (input as { declared?: Partial<DeclaredEnvironment> }).declared
    if (!declared) return null
    return {
      inputType: declared.inputType ?? null,
      deviceName: declared.deviceName ?? '',
    }
  }

  return {
    inputType: value.inputType ?? null,
    deviceName: value.deviceName ?? '',
  }
}

function normalizeDetected(legacy?: LegacyEnvironment): DetectedEnvironment {
  return {
    osName: legacy?.osName ?? 'Unknown',
    browserName: legacy?.browserName ?? 'Unknown',
    screenWidth: legacy?.screenWidth ?? 0,
    screenHeight: legacy?.screenHeight ?? 0,
    viewportWidth: legacy?.viewportWidth ?? 0,
    viewportHeight: legacy?.viewportHeight ?? 0,
    devicePixelRatio: legacy?.devicePixelRatio ?? 1,
    platform: legacy?.platform ?? 'Unknown',
    language: legacy?.language ?? 'unknown',
    timezone: legacy?.timezone ?? 'UTC',
    hasTouch: legacy?.hasTouch ?? false,
    pointerType: legacy?.pointerType ?? 'unknown',
  }
}

function normalizeMeasurement(measurement: Partial<SpinMeasurement> | undefined): SpinMeasurement {
  return {
    rawDeltaTotal: toNumber(measurement?.rawDeltaTotal, 0),
    normalizedDeltaTotal: toNumber(measurement?.normalizedDeltaTotal, 0),
    maxSingleDelta: toNumber(measurement?.maxSingleDelta, 0),
    eventCount: toNumber(measurement?.eventCount, 0),
    deltaMode: toNumber(measurement?.deltaMode, 0),
    durationMs: toNumber(measurement?.durationMs, 0),
    trusted: measurement?.trusted ?? false,
    inferredInputType: measurement?.inferredInputType ?? 'other',
    inferenceConfidence: toNumber(measurement?.inferenceConfidence, 0),
    anomalyFlags: measurement?.anomalyFlags ?? [],
    trustedScore: toNumber(measurement?.trustedScore, measurement?.trusted ? 1 : 0),
  }
}

function normalizeEnvironment(raw: unknown): EnvironmentProfile {
  if (!raw || typeof raw !== 'object') {
    const detected = normalizeDetected()
    return makeEnvironmentProfile(
      detected,
      { inputType: 'other', confidence: 0 },
      { inputType: null, deviceName: '' },
    )
  }

  const env = raw as Partial<EnvironmentProfile> & LegacyEnvironment

  if (env.detected && env.inferred && env.declared && env.effective) {
    return {
      detected: normalizeDetected(env.detected as LegacyEnvironment),
      inferred: {
        inputType: env.inferred.inputType ?? 'other',
        confidence: env.inferred.confidence ?? 0,
      },
      declared: {
        inputType: env.declared.inputType ?? null,
        deviceName: env.declared.deviceName ?? '',
      },
      effective: {
        inputType: env.effective.inputType ?? env.inferred.inputType ?? 'other',
        deviceName: env.effective.deviceName ?? env.declared.deviceName ?? '',
      },
    }
  }

  const legacy = env as LegacyEnvironment
  const detected = normalizeDetected(legacy)
  return makeEnvironmentProfile(
    detected,
    { inputType: legacy.inputType ?? 'other', confidence: 0.5 },
    {
      inputType: legacy.inputType ?? null,
      deviceName: legacy.deviceName ?? '',
    },
  )
}

function normalizeRun(raw: unknown): SavedRun | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Partial<SavedRun> & { environment?: unknown; measurement?: Partial<SpinMeasurement> }

  // measurement がなければ意味のある再計算ができないのでスキップ
  if (!value.measurement || typeof value.measurement !== 'object') return null

  return {
    id: typeof value.id === 'string' ? value.id : crypto.randomUUID(),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date(0).toISOString(),
    environment: normalizeEnvironment(value.environment),
    measurement: normalizeMeasurement(value.measurement),
    // 旧形式の result フィールドは読み捨て。必要時は calcRunResultFromMeasurement で再計算する。
  }
}

export function getBestRun(): SavedRun | null {
  return normalizeRun(safeParse<unknown>(localStorage.getItem(BEST_KEY)))
}

export function getLatestRun(): SavedRun | null {
  return normalizeRun(safeParse<unknown>(localStorage.getItem(LATEST_KEY)))
}

export function saveLatestRun(run: SavedRun): void {
  localStorage.setItem(LATEST_KEY, JSON.stringify(run))
}

export function saveBestRun(run: SavedRun): void {
  localStorage.setItem(BEST_KEY, JSON.stringify(run))
}

export function getSavedEnvironment(): DeclaredEnvironment | null {
  return toDeclaredEnvironment(safeParse<unknown>(localStorage.getItem(ENV_KEY)))
}

export function saveEnvironment(declared: DeclaredEnvironment): void {
  localStorage.setItem(ENV_KEY, JSON.stringify({ declared }))
}
