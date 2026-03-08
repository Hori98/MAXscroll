import type {
  DeclaredEnvironment,
  DetectedEnvironment,
  EnvironmentProfile,
  InferredEnvironment,
  InputType,
} from './types'

function getOsName(ua: string): string {
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Mac OS X/i.test(ua)) return 'macOS'
  if (/Android/i.test(ua)) return 'Android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Unknown'
}

function getBrowserName(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/OPR\//i.test(ua)) return 'Opera'
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome'
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  return 'Unknown'
}

function getPointerType(): 'fine' | 'coarse' | 'unknown' {
  if (window.matchMedia('(pointer: fine)').matches) return 'fine'
  if (window.matchMedia('(pointer: coarse)').matches) return 'coarse'
  return 'unknown'
}

export function resolveEffectiveInputType(declared: InputType | null, inferred: InputType): InputType {
  return declared ?? inferred
}

export function makeEnvironmentProfile(
  detected: DetectedEnvironment,
  inferred: InferredEnvironment,
  declared: DeclaredEnvironment,
): EnvironmentProfile {
  return {
    detected,
    inferred,
    declared,
    effective: {
      inputType: resolveEffectiveInputType(declared.inputType, inferred.inputType),
      deviceName: declared.deviceName,
      scrollSettingType: declared.scrollSettingType,
    },
  }
}

export function getDetectedEnvironment(): DetectedEnvironment {
  const ua = navigator.userAgent
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData

  return {
    osName: getOsName(ua),
    browserName: getBrowserName(ua),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    platform: uaData?.platform ?? navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hasTouch: navigator.maxTouchPoints > 0,
    pointerType: getPointerType(),
  }
}

export function getInitialInferredEnvironment(detected: DetectedEnvironment): InferredEnvironment {
  if (detected.hasTouch && detected.pointerType !== 'fine') {
    return { inputType: 'touch', confidence: 0.85 }
  }
  if (detected.pointerType === 'fine') {
    return { inputType: 'mouse-wheel', confidence: 0.6 }
  }
  return { inputType: 'other', confidence: 0.4 }
}

export function getEnvironmentProfile(): EnvironmentProfile {
  const detected = getDetectedEnvironment()
  const inferred = getInitialInferredEnvironment(detected)
  const declared: DeclaredEnvironment = {
    inputType: null,
    deviceName: '',
    scrollSettingType: 'unknown',
  }
  return makeEnvironmentProfile(detected, inferred, declared)
}
