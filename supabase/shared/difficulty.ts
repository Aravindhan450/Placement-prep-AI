export function getDifficulty(skill: number) {
  if (skill < 0.4) return "easy";
  if (skill < 0.7) return "medium";
  return "hard";
}