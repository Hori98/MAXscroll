import { useMemo, useState } from 'react'

import { FlyingPanel } from './components/FlyingPanel'
import { HomePanel } from './components/HomePanel'
import { ResultPanel } from './components/ResultPanel'
import { useSpinMeasurement } from './hooks/useSpinMeasurement'
import { getEnvironmentProfile } from './lib/getEnvironment'
import { getBestRun, saveBestRun, saveLatestRun } from './lib/storage'
import type { Phase, RunResult, SavedRun, SpinMeasurement } from './lib/types'

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

function App() {
  const environment = useMemo(() => getEnvironmentProfile(), [])
  const [phase, setPhase] = useState<Phase>('home')
  const [measurement, setMeasurement] = useState<SpinMeasurement | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [isNewBest, setIsNewBest] = useState(false)
  const [bestRun, setBestRun] = useState<SavedRun | null>(() => getBestRun())

  const { isListening, start, stop } = useSpinMeasurement({
    onComplete: (nextMeasurement) => {
      setMeasurement(nextMeasurement)
      setPhase('flying')
    },
  })

  const onLaunch = () => {
    setPhase('ready')
    setResult(null)
    setMeasurement(null)
    setIsNewBest(false)
    start()
  }

  const onFlightComplete = (nextResult: RunResult) => {
    if (!measurement) return

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

  const onRetry = () => {
    setResult(null)
    setMeasurement(null)
    setPhase('home')
  }

  if (phase === 'home' || phase === 'ready') {
    return <HomePanel environment={environment} bestRun={bestRun} isReady={isListening} onLaunch={onLaunch} />
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
      />
    )
  }

  return null
}

export default App
