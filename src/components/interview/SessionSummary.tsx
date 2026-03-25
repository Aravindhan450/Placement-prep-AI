import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useDashboardData } from "../../hooks/useDashboardData";

interface SessionSummaryProps {
  sessionId?: string | null;
  onContinue?: () => void;
  onFinish?: () => void;
}

export default function SessionSummary({ sessionId, onContinue, onFinish }: SessionSummaryProps) {
  const { loading, analytics } = useDashboardData();
  const [readiness, setReadiness] = useState<number | null>(null);
  const [loadingReadiness, setLoadingReadiness] = useState<boolean>(true);

  useEffect(() => {
    async function fetchReadiness() {
      if (!sessionId) {
        setReadiness(null);
        setLoadingReadiness(false);
        return;
      }

      setLoadingReadiness(true);
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("readiness_score")
        .eq("id", sessionId)
        .single();

      if (error) {
        console.error("Failed to load session readiness:", error);
        setReadiness(null);
        setLoadingReadiness(false);
        return;
      }

      const dbReadiness = data?.readiness_score ?? null;
      setReadiness(typeof dbReadiness === "number" ? dbReadiness : null);
      setLoadingReadiness(false);
    }

    void fetchReadiness();
  }, [sessionId]);

  const safeReadiness = readiness == null ? null : Math.max(0, Math.min(100, readiness));
  const readinessPercentage = safeReadiness == null ? null : Math.round(safeReadiness);

  if (loading || loadingReadiness) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-4 border-[#1a1a2e] border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-xl text-gray-400">Loading summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full glass-card p-10">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Session Summary
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Here's how you performed in this session
        </p>

        {/* Readiness Score - Featured */}
        <div className="glass-card bg-gradient-to-br from-indigo-500 to-purple-500 p-8 mb-8 border-indigo-500/50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Interview Readiness</h2>
              <p className="text-sm text-white/90">
                Stored from your completed interview session
              </p>
            </div>
            <div className="text-right">
              {readinessPercentage == null ? (
                <span className="text-sm text-white/90">Start practicing to generate readiness score</span>
              ) : (
                <span className="text-5xl font-bold text-white">{readinessPercentage}%</span>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          {readinessPercentage != null && (
            <div className="w-full h-3 bg-white/30 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${readinessPercentage}%` }}
              />
            </div>
          )}
          
          {/* Readiness Label */}
          <div className="text-center text-lg font-semibold text-white">
            {readinessPercentage == null ? "Start practicing to generate readiness score" :
             readinessPercentage >= 80 ? '🎯 Excellent! Ready for interviews' :
             readinessPercentage >= 60 ? '📈 Good progress! Keep practicing' :
             readinessPercentage >= 40 ? '💪 Building skills steadily' :
             '🌱 Just getting started'}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Questions Attempted */}
          <div className="glass-card p-6 text-center">
            <div className="text-3xl mb-3">📝</div>
            <div className="text-3xl font-bold text-white mb-2">{analytics.questions_attempted}</div>
            <div className="text-sm text-gray-400 font-medium">Questions Attempted</div>
          </div>

          {/* Average Skill */}
          <div className="glass-card p-6 text-center">
            <div className="text-3xl mb-3">📊</div>
            <div className="text-3xl font-bold text-white mb-2">{Math.round(analytics.average_skill * 100)}%</div>
            <div className="text-sm text-gray-400 font-medium">Average Skill</div>
          </div>

          {/* Improvement Rate */}
          <div className="glass-card p-6 text-center">
            <div className="text-3xl mb-3">📈</div>
            <div className="text-3xl font-bold text-white mb-2">+{(analytics.improvement_rate * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-400 font-medium">Improvement Rate</div>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Difficulty Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4 border-l-4 border-green-500 flex flex-col items-center gap-2">
              <span className="text-sm text-gray-400 font-medium">Easy</span>
              <span className="text-2xl font-bold text-green-400">
                {analytics.difficulty_distribution.easy}
              </span>
            </div>
            <div className="glass-card p-4 border-l-4 border-amber-500 flex flex-col items-center gap-2">
              <span className="text-sm text-gray-400 font-medium">Medium</span>
              <span className="text-2xl font-bold text-amber-400">
                {analytics.difficulty_distribution.medium}
              </span>
            </div>
            <div className="glass-card p-4 border-l-4 border-red-500 flex flex-col items-center gap-2">
              <span className="text-sm text-gray-400 font-medium">Hard</span>
              <span className="text-2xl font-bold text-red-400">
                {analytics.difficulty_distribution.hard}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          {onContinue && (
            <button 
              className="px-8 py-3 text-base font-semibold text-gray-300 glass-card hover:bg-[#1a1a2e] transition-all"
              onClick={onContinue}
            >
              Continue Practicing
            </button>
          )}
          {onFinish && (
            <button 
              className="btn-premium px-8"
              onClick={onFinish}
            >
              View Full Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
