export type Phase = 'home' | 'ready' | 'flying' | 'result'

export type EnvironmentProfile = {
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

export type SpinMeasurement = {
  rawDeltaTotal: number
  normalizedDeltaTotal: number
  maxSingleDelta: number
  eventCount: number
  deltaMode: number
  durationMs: number
  trusted: boolean
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
