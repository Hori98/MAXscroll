export function normalizeDelta(deltaY: number, deltaMode: number): number {
  switch (deltaMode) {
    case 0:
      return Math.abs(deltaY)
    case 1:
      return Math.abs(deltaY) * 16
    case 2:
      return Math.abs(deltaY) * window.innerHeight
    default:
      return Math.abs(deltaY)
  }
}
