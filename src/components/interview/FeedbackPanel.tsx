import type { Evaluation } from '../../types/interview';

interface FeedbackPanelProps {
  evaluation: Evaluation;
  mentorInsight?: string | null;
  onPracticeSimilar?: () => void;
  practiceLoading?: boolean;
}

export default function FeedbackPanel({
  evaluation,
  mentorInsight,
  onPracticeSimilar,
  practiceLoading = false,
}: FeedbackPanelProps) {
  const toPercent = (value: number): number => Math.round(value * 100);
  
  const getColorClass = (value: number): string => {
    if (value >= 0.8) return 'bg-green-500';
    if (value >= 0.6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTextColorClass = (value: number): string => {
    if (value >= 0.8) return 'text-green-400';
    if (value >= 0.6) return 'text-amber-400';
    return 'text-red-400';
  };

  const metrics = [
    { label: 'Correctness', value: evaluation.correctness, icon: '✓' },
    { label: 'Concept Depth', value: evaluation.concept_depth, icon: '📚' },
    { label: 'Confidence', value: evaluation.confidence, icon: '💪' },
    { label: 'Clarity', value: evaluation.clarity, icon: '💡' },
  ];

  return (
    <div className="space-y-6">
      {/* Feedback Card */}
      <div className="glass-card p-6 border-indigo-500/30">
        <h3 className="text-xs text-indigo-400 tracking-widest mb-3 uppercase font-semibold">
          AI Feedback
        </h3>
        <p className="text-gray-300 leading-relaxed">
          {evaluation.feedback}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric-card">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{metric.icon}</span>
              <span className="text-sm font-semibold text-gray-300">{metric.label}</span>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 ${getColorClass(metric.value)}`}
                style={{ width: `${toPercent(metric.value)}%` }}
              />
            </div>
            
            {/* Percentage */}
            <div className="text-right">
              <span className={`text-sm font-semibold ${getTextColorClass(metric.value)}`}>
                {toPercent(metric.value)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mentor Insight */}
      {mentorInsight && (
        <div className="glass-card p-6 border-green-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🧠</span>
            <h3 className="text-xs text-green-400 tracking-widest uppercase font-semibold">
              Adaptive Mentor Insight
            </h3>
          </div>
          <div className="h-px bg-green-500/20 mb-3"></div>
          <p className="text-gray-300 leading-relaxed">
            {mentorInsight}
          </p>
        </div>
      )}

      {onPracticeSimilar && (
        <button
          onClick={onPracticeSimilar}
          disabled={practiceLoading}
          className="w-full py-3 px-6 rounded-xl font-semibold text-white
            bg-gradient-to-r from-purple-500 to-indigo-500
            hover:from-purple-600 hover:to-indigo-600
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 flex items-center justify-center gap-2"
        >
          {practiceLoading ? "Generating Similar Question..." : "Practice Similar Question"}
        </button>
      )}
    </div>
  );
}
