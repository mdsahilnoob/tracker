export function shouldCelebrateGoal(previousMinutes: number | null, currentMinutes: number, goalMinutes: number): boolean {
  return previousMinutes !== null && previousMinutes < goalMinutes && currentMinutes >= goalMinutes;
}
