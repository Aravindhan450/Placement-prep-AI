interface NextStepCardProps {
  topic: string;
  avgSkill: number;
}

function toDisplayTopic(topic: string): string {
  return topic.trim().length > 0 ? topic.toUpperCase() : "GENERAL";
}

export default function NextStepCard({ topic, avgSkill }: NextStepCardProps) {
  const safeSkill = Math.max(0, Math.min(1, avgSkill));
  const reason =
    safeSkill < 0.4
      ? `Your accuracy drops significantly on ${topic} problems.`
      : safeSkill < 0.7
        ? `Your accuracy drops on harder ${topic} questions.`
        : `You are close to mastery, but ${topic} still limits top-end consistency.`;

  return (
    <div className="glass-card p-8 mb-8 border-indigo-500/30">
      <h2 className="text-2xl font-semibold text-white mb-4">Your Next Step</h2>
      <p className="text-sm uppercase tracking-widest text-indigo-300 mb-1">Focus:</p>
      <p className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6">
        {toDisplayTopic(topic)}
      </p>

      <div className="space-y-3 text-gray-200">
        <p>
          <span className="font-semibold text-white">Reason:</span> {reason}
        </p>
        <div>
          <p className="font-semibold text-white mb-2">Recommended Action:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>Practice 3 more {topic} problems</li>
            <li>Review core concepts</li>
            <li>Return tomorrow for reinforcement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
