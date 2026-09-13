export function getMotionDuration(baseDuration: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return Number.isFinite(baseDuration) ? Math.max(0, Math.round(baseDuration)) : 0;
}
