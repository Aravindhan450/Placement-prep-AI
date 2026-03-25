export function generateFocusExplanation(topic: string, readiness: number): string {
  const safeTopic = topic.trim().length > 0 ? topic : "this area";
  const safeReadiness = Math.max(0, Math.min(100, readiness));

  if (safeReadiness < 40) {
    return `Building stronger fundamentals in ${safeTopic} will improve your confidence and raise baseline performance.`;
  }

  if (safeReadiness <= 70) {
    return `You perform strongly overall, but ${safeTopic} reduces your consistency on harder problems.`;
  }

  return `You are close to interview-ready; mastering advanced ${safeTopic} patterns can unlock the next jump in readiness.`;
}
