import { CheckCircle, XCircle, TrendingUp, TrendingDown, Minus, Target, AlertCircle } from "lucide-react";

interface FeedbackCardProps {
  score: number;
  feedback: string;
  strength?: string;
  weakness?: string;
  previousDifficulty?: string;
  nextDifficulty?: string;
  onPracticeSimilar?: () => void;
  practiceLoading?: boolean;
}

export default function FeedbackCard({
  score,
  feedback,
  strength,
  weakness,
  previousDifficulty,
  nextDifficulty,
  onPracticeSimilar,
  practiceLoading = false,
}: FeedbackCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 6) {
      return <CheckCircle size={24} className="text-green-500" />;
    }
    return <XCircle size={24} className="text-red-500" />;
  };

  const getDifficultyChange = () => {
    if (!previousDifficulty || !nextDifficulty) return null;
    
    const levels = ["easy", "medium", "hard"];
    const prevIndex = levels.indexOf(previousDifficulty);
    const nextIndex = levels.indexOf(nextDifficulty);
    
    if (nextIndex > prevIndex) {
      return (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <TrendingUp size={16} />
          <span className="text-sm">Difficulty increased to {nextDifficulty}</span>
        </div>
      );
    } else if (nextIndex < prevIndex) {
      return (
        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <TrendingDown size={16} />
          <span className="text-sm">Difficulty decreased to {nextDifficulty}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Minus size={16} />
        <span className="text-sm">Difficulty stays at {nextDifficulty}</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 animate-fadeIn">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{getScoreIcon(score)}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Evaluation Results
            </h3>
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}/10
            </span>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-3">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {feedback}
            </p>
          </div>
          
          {/* Strength and Weakness */}
          {(strength || weakness) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {strength && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Target size={16} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-green-800 dark:text-green-300 uppercase mb-1">
                        Strength
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {strength}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {weakness && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-orange-800 dark:text-orange-300 uppercase mb-1">
                        Area to Improve
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-400">
                        {weakness}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {getDifficultyChange()}

          {onPracticeSimilar && (
            <button
              onClick={onPracticeSimilar}
              disabled={practiceLoading}
              className="mt-4 w-full py-3 px-4 rounded-lg font-semibold text-white
                bg-gradient-to-r from-purple-500 to-indigo-500
                hover:from-purple-600 hover:to-indigo-600
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              {practiceLoading ? "Generating Similar Question..." : "Practice Similar Question"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
