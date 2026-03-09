// deltaY の符号を保持して正規化する（正 = 下スクロール、負 = 上スクロール）
export function normalizeDelta(deltaY: number, deltaMode: number): number {
  switch (deltaMode) {
    case 0:
      return deltaY
    case 1:
      return deltaY * 16
    case 2:
      return deltaY * window.innerHeight
    default:
      return deltaY
  }
}
