/**
 * Util pure pentru generarea de date de distribuție mock (gaussian-ish bell
 * curve). Separat de componenta client `ScoreDistribution` ca să poată fi
 * apelat din server components (landing page, exam results SSR).
 */

export interface ScoreDistributionPoint {
  score: number
  density: number
}

export function mockBellCurve(
  mean = 720,
  stddev = 80,
  min = 500,
  max = 950,
  step = 10,
): ScoreDistributionPoint[] {
  const data: ScoreDistributionPoint[] = []
  for (let s = min; s <= max; s += step) {
    const z = (s - mean) / stddev
    const density = Math.exp(-0.5 * z * z)
    data.push({ score: s, density })
  }
  return data
}
