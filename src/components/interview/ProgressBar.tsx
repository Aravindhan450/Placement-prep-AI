import { CheckCircle, Circle } from "lucide-react";

interface ProgressBarProps {
  current: number;
  total: number;
  score?: number;
}

export default function ProgressBar({ current, total, score }: ProgressBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-700 dark:text-gray-300">
          Question {current} of {total}
        </span>
        {score !== undefined && (
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            Avg Score: {score.toFixed(1)}/10
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex gap-1 mt-2">
        {Array.from({ length: total }).map((_, idx) => (
          <div key={idx} className="flex-1">
            {idx < current ? (
              <CheckCircle size={16} className="text-green-500" />
            ) : (
              <Circle size={16} className="text-gray-300 dark:text-gray-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
