export function formatAdBreakCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

export function getAdBreakRemainingSeconds(
  progress: google.ima.dai.api.AdProgressData,
  breakStartedAtMs: number,
): number | null {
  const breakDuration = progress.adBreakDuration
  if (!breakDuration || breakDuration <= 0) {
    return null
  }

  const periodElapsed = progress.adPeriodDuration
  if (
    typeof periodElapsed === 'number' &&
    periodElapsed >= 0 &&
    periodElapsed <= breakDuration
  ) {
    return Math.max(0, Math.ceil(breakDuration - periodElapsed))
  }

  const wallElapsed = (performance.now() - breakStartedAtMs) / 1000
  return Math.max(0, Math.ceil(breakDuration - wallElapsed))
}
