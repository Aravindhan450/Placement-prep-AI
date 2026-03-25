interface AttemptLike {
  skill_index: number;
}

export function generateProgressNarrative(attempts: AttemptLike[]): string {
  if (!attempts || attempts.length < 3) {
    return "Complete a few more attempts to unlock a reliable progress story.";
  }

  const skills = attempts.map((a) => Number(a.skill_index ?? 0)).filter((v) => Number.isFinite(v));
  if (skills.length < 3) {
    return "Complete a few more attempts to unlock a reliable progress story.";
  }

  const first = skills[0];
  const last = skills[skills.length - 1];
  const delta = last - first;
  const stepDiffs = skills.slice(1).map((value, idx) => value - skills[idx]);
  const meanAbsStep =
    stepDiffs.reduce((sum, d) => sum + Math.abs(d), 0) / Math.max(1, stepDiffs.length);

  if (delta > 0.05 && meanAbsStep <= 0.08) {
    return "You're improving consistently.";
  }

  if (delta < -0.05) {
    return "Recent sessions show difficulty increase.";
  }

  return "Performance varies — focus on fundamentals.";
}
