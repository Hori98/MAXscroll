import { useMemo } from 'react'

type SoundApi = {
  playLaunch: () => void
  playResult: () => void
  playClick: () => void
}

export function useSoundEffects(): SoundApi {
  const audioContext = useMemo(() => {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    return Ctx ? new Ctx() : null
  }, [])

  const beep = (frequency: number, durationMs: number, volume: number) => {
    if (!audioContext) return
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.value = volume
    osc.connect(gain)
    gain.connect(audioContext.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + durationMs / 1000)
    osc.stop(audioContext.currentTime + durationMs / 1000)
  }

  return {
    playLaunch: () => {
      void audioContext?.resume()
      beep(420, 80, 0.03)
      window.setTimeout(() => beep(640, 90, 0.03), 70)
    },
    playResult: () => {
      void audioContext?.resume()
      beep(780, 120, 0.04)
      window.setTimeout(() => beep(1040, 150, 0.04), 110)
    },
    playClick: () => {
      void audioContext?.resume()
      beep(520, 60, 0.02)
    },
  }
}
