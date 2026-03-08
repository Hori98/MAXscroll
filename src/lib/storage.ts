import type { SavedRun } from './types'

const BEST_KEY = 'spinlaunch_best'
const LATEST_KEY = 'spinlaunch_latest'

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getBestRun(): SavedRun | null {
  return safeParse<SavedRun>(localStorage.getItem(BEST_KEY))
}

export function getLatestRun(): SavedRun | null {
  return safeParse<SavedRun>(localStorage.getItem(LATEST_KEY))
}

export function saveLatestRun(run: SavedRun): void {
  localStorage.setItem(LATEST_KEY, JSON.stringify(run))
}

export function saveBestRun(run: SavedRun): void {
  localStorage.setItem(BEST_KEY, JSON.stringify(run))
}
