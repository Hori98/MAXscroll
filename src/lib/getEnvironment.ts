import type { EnvironmentProfile } from './types'

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

function inferInputType(profile: Pick<EnvironmentProfile, 'hasTouch' | 'pointerType'>): EnvironmentProfile['inputType'] {
  if (profile.pointerType === 'fine') return 'mouse-wheel'
  if (profile.hasTouch) return 'touch'
  return 'other'
}

export function getEnvironmentProfile(): EnvironmentProfile {
  const ua = navigator.userAgent
  const pointerType = getPointerType()
  const hasTouch = navigator.maxTouchPoints > 0

  return {
    osName: getOsName(ua),
    browserName: getBrowserName(ua),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hasTouch,
    pointerType,
    inputType: inferInputType({ hasTouch, pointerType }),
    deviceName: '',
    scrollSettingType: 'unknown',
  }
}
