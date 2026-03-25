export function calculateSkillIndex(
  correctness: number,
  depth: number,
  confidence: number,
  clarity: number
) {
  return (
    correctness * 0.4 +
    depth * 0.3 +
    confidence * 0.2 +
    clarity * 0.1
  );
}

export function updateSkill(oldSkill: number, SI: number) {
  const alpha = 0.3;
  return oldSkill + alpha * (SI - oldSkill);
}