import { useEffect, useMemo, useState } from 'react'

import { FlyingPanel } from './components/FlyingPanel'
import { HomePanel } from './components/HomePanel'
import { InterstitialAd } from './components/InterstitialAd'
import { ResultPanel } from './components/ResultPanel'
import { useSpinMeasurement } from './hooks/useSpinMeasurement'
import { useSoundEffects } from './hooks/useSoundEffects'
import { getEnvironmentProfile } from './lib/getEnvironment'
import { buildShareImage } from './lib/shareImage'
import {
  getBestRun,
  getSavedEnvironment,
  saveBestRun,
  saveEnvironment,
  saveLatestRun,
} from './lib/storage'
import type { EnvironmentProfile, Phase, RunResult, SavedRun, SpinMeasurement } from './lib/types'

function createSavedRun(
  environment: SavedRun['environment'],
  measurement: SpinMeasurement,
  result: RunResult,
): SavedRun {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    environment,
    measurement,
    result,
  }
}

function mergeEnvironment(base: EnvironmentProfile, saved: Partial<EnvironmentProfile> | null): EnvironmentProfile {
  if (!saved) return base
  return {
    ...base,
    ...saved,
    inputType: saved.inputType ?? base.inputType,
    deviceName: saved.deviceName ?? base.deviceName,
    scrollSettingType: saved.scrollSettingType ?? base.scrollSettingType,
  }
}

function App() {
  const initialEnvironment = useMemo(() => {
    const auto = getEnvironmentProfile()
    const saved = getSavedEnvironment()
    return mergeEnvironment(auto, saved)
  }, [])

  const [environment, setEnvironment] = useState<EnvironmentProfile>(initialEnvironment)
  const [phase, setPhase] = useState<Phase>('home')
  const [measurement, setMeasurement] = useState<SpinMeasurement | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [isNewBest, setIsNewBest] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'done'>('idle')
  const [adCountdown, setAdCountdown] = useState(2)
  const [bestRun, setBestRun] = useState<SavedRun | null>(() => getBestRun())
  const { playLaunch, playResult, playClick } = useSoundEffects()

  const { isListening, start, stop } = useSpinMeasurement({
    onComplete: (nextMeasurement) => {
      setMeasurement(nextMeasurement)
      setPhase('flying')
    },
  })

  const onLaunch = () => {
    playLaunch()
    setPhase('ready')
    setResult(null)
    setMeasurement(null)
    setIsNewBest(false)
    setShareState('idle')
    start()
  }

  const onEnvironmentChange = (patch: Partial<EnvironmentProfile>) => {
    const next = { ...environment, ...patch }
    setEnvironment(next)
    saveEnvironment({
      inputType: next.inputType,
      deviceName: next.deviceName,
      scrollSettingType: next.scrollSettingType,
    })
  }

  const onFlightComplete = (nextResult: RunResult) => {
    if (!measurement) return

    playResult()
    const run = createSavedRun(environment, measurement, nextResult)
    saveLatestRun(run)

    const shouldUpdateBest = !bestRun || nextResult.displayedDistanceMeters > bestRun.result.displayedDistanceMeters
    if (shouldUpdateBest) {
      saveBestRun(run)
      setBestRun(run)
    }
    setIsNewBest(shouldUpdateBest)

    setResult(nextResult)
    stop()
    setPhase('result')
  }

  const onShare = async () => {
    if (!result) return

    const text = `SPIN LAUNCH ${result.displayedDistanceMeters.toFixed(1)}m | max ${result.displayedMaxSpeedKmh.toFixed(1)}km/h | ${environment.osName}/${environment.browserName}/${environment.inputType}`
    const imageFile = await buildShareImage(result, environment)

    if (navigator.share && imageFile && navigator.canShare?.({ files: [imageFile] })) {
      try {
        await navigator.share({
          title: 'SPIN LAUNCH',
          text,
          files: [imageFile],
          url: window.location.href,
        })
        return
      } catch {
        // Fall back to text share/clipboard.
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SPIN LAUNCH',
          text,
          url: window.location.href,
        })
        return
      } catch {
        // Fall back to clipboard when share is dismissed or unsupported at runtime.
      }
    }

    await navigator.clipboard.writeText(`${text} ${window.location.href}`)
    setShareState('done')
    window.setTimeout(() => setShareState('idle'), 1200)
  }

  const onRetry = () => {
    playClick()
    setResult(null)
    setMeasurement(null)
    setAdCountdown(2)
    setPhase('interstitial')
  }

  const onCloseInterstitial = () => {
    setPhase('home')
  }

  useEffect(() => {
    if (phase !== 'interstitial' || adCountdown <= 0) return
    const timer = window.setTimeout(() => setAdCountdown((prev) => Math.max(0, prev - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [adCountdown, phase])

  if (phase === 'interstitial') {
    return <InterstitialAd onContinue={onCloseInterstitial} secondsLeft={adCountdown} />
  }

  if (phase === 'home' || phase === 'ready') {
    return (
      <HomePanel
        environment={environment}
        bestRun={bestRun}
        isReady={isListening}
        onLaunch={onLaunch}
        onEnvironmentChange={onEnvironmentChange}
      />
    )
  }

  if (phase === 'flying' && measurement) {
    return <FlyingPanel environment={environment} measurement={measurement} onComplete={onFlightComplete} />
  }

  if (phase === 'result' && measurement && result) {
    return (
      <ResultPanel
        environment={environment}
        measurement={measurement}
        result={result}
        bestRun={bestRun}
        isNewBest={isNewBest}
        onRetry={onRetry}
        onShare={onShare}
        shareState={shareState}
      />
    )
  }

  return null
}

export default App
