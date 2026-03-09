import type { EnvironmentProfile, RunResult } from './types'

export async function buildShareImage(result: RunResult, environment: EnvironmentProfile): Promise<File | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const gradient = ctx.createLinearGradient(0, 0, 1200, 630)
  gradient.addColorStop(0, '#0a1224')
  gradient.addColorStop(1, '#031018')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'rgba(56, 242, 184, 0.15)'
  ctx.fillRect(80, 80, 1040, 470)

  ctx.fillStyle = '#b6fff0'
  ctx.font = '700 64px "IBM Plex Mono", monospace'
  ctx.fillText('SPIN LAUNCH', 110, 170)

  ctx.fillStyle = '#e7fbff'
  ctx.font = '700 120px "IBM Plex Mono", monospace'
  const sign = result.totalDeltaPx >= 0 ? '+' : ''
  ctx.fillText(`${sign}${result.totalDeltaPx.toFixed(0)} px`, 110, 330)

  ctx.fillStyle = '#9dd6ff'
  ctx.font = '500 42px "Space Grotesk", sans-serif'
  ctx.fillText(`Avg Speed ${sign}${result.averageSpeedPxMs.toFixed(2)} px/ms`, 110, 408)
  ctx.fillText(
    `${environment.detected.osName} / ${environment.detected.browserName} / ${environment.effective.inputType}`,
    110,
    468,
  )

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return null
  return new File([blob], 'spin-launch-result.png', { type: 'image/png' })
}
