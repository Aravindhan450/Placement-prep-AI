import { Target } from "lucide-react";

interface FocusRecommendationCardProps {
  topic: string;
  explanation: string;
}

export default function FocusRecommendationCard({ topic, explanation }: FocusRecommendationCardProps) {
  return (
    <div className="glass-card p-8 mb-8 border-indigo-500/30">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">Recommended Focus Area</h2>
          <p className="text-5xl font-bold tracking-wide bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {topic.toUpperCase()}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
          <Target className="text-indigo-300" size={22} />
        </div>
      </div>
      <p className="text-gray-300 leading-relaxed">{explanation}</p>
    </div>
  );
}
