interface DailyMissionCardProps {
  topic: string;
  completed: number;
  targetQuestions: number;
  onStart: () => void;
}

export default function DailyMissionCard({
  topic,
  completed,
  targetQuestions,
  onStart,
}: DailyMissionCardProps) {
  const safeCompleted = Math.max(0, Math.min(targetQuestions, completed));
  const progress = targetQuestions > 0 ? (safeCompleted / targetQuestions) * 100 : 0;
  const done = safeCompleted >= targetQuestions;

  return (
    <div className="glass-card p-8 mb-8 border-indigo-500/30">
      <h2 className="text-2xl font-semibold text-white mb-4">Today&apos;s Interview Mission</h2>
      <p className="text-sm uppercase tracking-widest text-indigo-300 mb-1">Topic</p>
      <p className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
        {topic.toUpperCase()}
      </p>

      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-300">Progress</span>
        <span className="text-indigo-300 font-semibold">
          {safeCompleted}/{targetQuestions} completed
        </span>
      </div>
      <div className="h-3 bg-[#1a1a2e] rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        onClick={onStart}
        disabled={done}
        className="w-full py-3 px-6 rounded-xl font-semibold text-white
          bg-gradient-to-r from-indigo-500 to-purple-500
          hover:from-indigo-600 hover:to-purple-600
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200"
      >
        {done ? "Mission Completed" : "Start Mission"}
      </button>
    </div>
  );
}
