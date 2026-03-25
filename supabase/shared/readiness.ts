const DIFFICULTY_WEIGHT: Record<string, number> = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.2,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toPercent(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score <= 1) return clamp(score * 100, 0, 100);
  return clamp(score, 0, 100);
}

export interface ReadinessInput {
  lastSessionAvgScores: number[];
  difficultyWeighting: number;
  improvementTrend: number;
}

export function calculateDifficultyFactor(difficulties: string[]): number {
  if (!Array.isArray(difficulties) || difficulties.length === 0) return 50;

  const minWeight = Math.min(...Object.values(DIFFICULTY_WEIGHT));
  const maxWeight = Math.max(...Object.values(DIFFICULTY_WEIGHT));
  const total = difficulties.reduce((sum, difficulty) => {
    const normalized = String(difficulty).trim().toLowerCase();
    return sum + (DIFFICULTY_WEIGHT[normalized] ?? DIFFICULTY_WEIGHT.medium);
  }, 0);

  const avgWeight = total / difficulties.length;
  const normalized = (avgWeight - minWeight) / (maxWeight - minWeight);
  return clamp(normalized * 100, 0, 100);
}

export function calculateImprovementTrend(lastSessionAvgScores: number[]): number {
  if (!Array.isArray(lastSessionAvgScores) || lastSessionAvgScores.length < 2) return 50;
  const normalizedScores = lastSessionAvgScores.map(toPercent);
  const first = normalizedScores[0];
  const last = normalizedScores[normalizedScores.length - 1];
  const delta = last - first; // [-100, +100]
  return clamp(50 + delta / 2, 0, 100);
}

export function calculateReadinessScore(input: ReadinessInput): number {
  const averageScorePercent = input.lastSessionAvgScores.length > 0
    ? input.lastSessionAvgScores.map(toPercent).reduce((sum, value) => sum + value, 0) /
      input.lastSessionAvgScores.length
    : 0;
  const improvementTrend = clamp(input.improvementTrend, 0, 100);
  const difficultyFactor = clamp(input.difficultyWeighting, 0, 100);

  const readiness =
    averageScorePercent * 0.6 +
    improvementTrend * 0.25 +
    difficultyFactor * 0.15;

  return Number(clamp(readiness, 0, 100).toFixed(2));
}
