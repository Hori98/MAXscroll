import { useEffect, useMemo, useState } from 'react'

import { ArmedPanel } from './components/ArmedPanel'
import { CountdownPanel } from './components/CountdownPanel'
import { HomePanel } from './components/HomePanel'
import { InterstitialAd } from './components/InterstitialAd'
import { MeasuringPanel } from './components/MeasuringPanel'
import { ResultPanel } from './components/ResultPanel'
import { useSoundEffects } from './hooks/useSoundEffects'
import { useSpinMeasurement } from './hooks/useSpinMeasurement'
import { calcRunResultFromMeasurement } from './lib/calcRunResult'
import { getEnvironmentProfile, makeEnvironmentProfile } from './lib/getEnvironment'
import { buildShareImage } from './lib/shareImage'
import {
  getBestRun,
  getLatestRun,
  getSavedEnvironment,
  saveBestRun,
  saveEnvironment,
  saveLatestRun,
} from './lib/storage'
import type {
  DeclaredEnvironment,
  EnvironmentProfile,
  Phase,
  RunResult,
  SavedRun,
  SpinMeasurement,
  SpinMeasurementProgress,
} from './lib/types'

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

function mergeDeclaredEnvironment(base: EnvironmentProfile, declared: DeclaredEnvironment | null): EnvironmentProfile {
  if (!declared) return base
  return makeEnvironmentProfile(base.detected, base.inferred, {
    inputType: declared.inputType,
    deviceName: declared.deviceName,
    scrollSettingType: declared.scrollSettingType,
  })
}

function App() {
  const initialEnvironment = useMemo(() => {
    const auto = getEnvironmentProfile()
    const saved = getSavedEnvironment()
    return mergeDeclaredEnvironment(auto, saved)
  }, [])

  const [environment, setEnvironment] = useState<EnvironmentProfile>(initialEnvironment)
  const [phase, setPhase] = useState<Phase>('home')
  const [countdown, setCountdown] = useState(3)
  const [measurement, setMeasurement] = useState<SpinMeasurement | null>(null)
  const [measurementProgress, setMeasurementProgress] = useState<SpinMeasurementProgress | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [previousRun, setPreviousRun] = useState<SavedRun | null>(null)
  const [isNewBest, setIsNewBest] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'done'>('idle')
  const [adCountdown, setAdCountdown] = useState(2)
  const [bestRun, setBestRun] = useState<SavedRun | null>(() => getBestRun())
  const { playLaunch, playResult, playClick } = useSoundEffects()

  const { start, stop } = useSpinMeasurement({
    onStart: () => {
      setPhase('measuring')
    },
    onProgress: (progress) => {
      setMeasurementProgress(progress)
    },
    onComplete: (nextMeasurement) => {
      setMeasurement(nextMeasurement)
      setMeasurementProgress(null)
      setEnvironment((prev) =>
        makeEnvironmentProfile(
          prev.detected,
          {
            inputType: nextMeasurement.inferredInputType,
            confidence: nextMeasurement.inferenceConfidence,
          },
          prev.declared,
        ),
      )
      const nextResult = calcRunResultFromMeasurement(nextMeasurement)
      onFlightComplete(nextResult, nextMeasurement)
    },
  })

  const onLaunch = () => {
    playLaunch()
    stop()
    setResult(null)
    setMeasurement(null)
    setMeasurementProgress(null)
    setPreviousRun(null)
    setIsNewBest(false)
    setShareState('idle')
    setCountdown(3)
    setPhase('countdown')
  }

  const onEnvironmentChange = (patch: Partial<DeclaredEnvironment>) => {
    setEnvironment((prev) => {
      const nextDeclared: DeclaredEnvironment = {
        ...prev.declared,
        ...patch,
      }
      saveEnvironment(nextDeclared)
      return makeEnvironmentProfile(prev.detected, prev.inferred, nextDeclared)
    })
  }

  const onFlightComplete = (nextResult: RunResult, measured: SpinMeasurement) => {
    playResult()
    const prevLatest = getLatestRun()
    setPreviousRun(prevLatest)
    const run = createSavedRun(environment, measured, nextResult)
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

    const text = `SPIN LAUNCH ${result.displayedDistanceMeters.toFixed(1)}m | max ${result.displayedMaxSpeedKmh.toFixed(1)}km/h | ${environment.detected.osName}/${environment.detected.browserName}/${environment.effective.inputType}`
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
    setMeasurementProgress(null)
    setPreviousRun(null)
    setAdCountdown(2)
    setPhase('interstitial')
  }

  const onCloseInterstitial = () => {
    setPreviousRun(null)
    setPhase('home')
  }

  const onBackHome = () => {
    setResult(null)
    setMeasurement(null)
    setMeasurementProgress(null)
    setPreviousRun(null)
    setPhase('home')
  }

  useEffect(() => {
    if (phase !== 'interstitial' || adCountdown <= 0) return
    const timer = window.setTimeout(() => setAdCountdown((prev) => Math.max(0, prev - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [adCountdown, phase])

  useEffect(() => {
    if (phase !== 'countdown') return

    if (countdown <= 1) {
      const timer = window.setTimeout(() => {
        setPhase('armed')
      }, 1000)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => setCountdown((prev) => prev - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown, phase])

  useEffect(() => {
    if (phase === 'armed') {
      start()
    }
  }, [phase, start, stop])

  useEffect(() => {
    if (phase !== 'armed' && phase !== 'measuring') {
      stop()
    }
  }, [phase, stop])

  if (phase === 'interstitial') {
    return <InterstitialAd onContinue={onCloseInterstitial} secondsLeft={adCountdown} />
  }

  if (phase === 'home') {
    return (
      <HomePanel
        environment={environment}
        bestRun={bestRun}
        onLaunch={onLaunch}
        onEnvironmentChange={onEnvironmentChange}
      />
    )
  }

  if (phase === 'countdown') {
    return <CountdownPanel count={countdown} />
  }

  if (phase === 'armed') {
    return <ArmedPanel hasTouch={environment.detected.hasTouch} />
  }

  if (phase === 'measuring') {
    return <MeasuringPanel hasTouch={environment.detected.hasTouch} progress={measurementProgress} />
  }

  if (phase === 'result' && measurement && result) {
    return (
      <ResultPanel
        environment={environment}
        result={result}
        previousRun={previousRun}
        isNewBest={isNewBest}
        onRetry={onRetry}
        onBackHome={onBackHome}
        onShare={onShare}
        shareState={shareState}
      />
    )
  }

  return null
}

export default App
