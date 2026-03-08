export type Phase = 'home' | 'countdown' | 'armed' | 'flying' | 'result' | 'interstitial'

export type InputType =
  | 'mouse-wheel'
  | 'free-spin-wheel'
  | 'trackpad'
  | 'magic-mouse'
  | 'touch'
  | 'other'

export type DetectedEnvironment = {
  osName: string
  browserName: string
  screenWidth: number
  screenHeight: number
  viewportWidth: number
  viewportHeight: number
  devicePixelRatio: number
  platform: string
  language: string
  timezone: string
  hasTouch: boolean
  pointerType: 'fine' | 'coarse' | 'unknown'
}

export type InferredEnvironment = {
  inputType: InputType
  confidence: number
}

export type DeclaredEnvironment = {
  inputType: InputType | null
  deviceName: string
  scrollSettingType: 'default' | 'custom' | 'unknown'
}

export type EffectiveEnvironment = {
  inputType: InputType
  deviceName: string
  scrollSettingType: 'default' | 'custom' | 'unknown'
}

export type EnvironmentProfile = {
  detected: DetectedEnvironment
  inferred: InferredEnvironment
  declared: DeclaredEnvironment
  effective: EffectiveEnvironment
}

export type SpinMeasurement = {
  rawDeltaTotal: number
  normalizedDeltaTotal: number
  maxSingleDelta: number
  eventCount: number
  deltaMode: number
  durationMs: number
  trusted: boolean
  inferredInputType: InputType
  inferenceConfidence: number
  anomalyFlags: string[]
  trustedScore: number
}

export type RunResult = {
  finalDistance: number
  maxSpeed: number
  initialSpeed: number
  displayedDistanceMeters: number
  displayedMaxSpeedKmh: number
}

export type SavedRun = {
  id: string
  createdAt: string
  environment: EnvironmentProfile
  measurement: SpinMeasurement
  result: RunResult
}
