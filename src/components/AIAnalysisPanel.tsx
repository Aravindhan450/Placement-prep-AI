import { useState } from "react";
import { X, Sparkles, Loader2, TrendingUp, AlertCircle } from "lucide-react";

type Analysis = {
  matchScore: number;
  missingKeywords: string[];
  suggestions: string[];
};

type AIAnalysisPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysis: Analysis | null;
};

export default function AIAnalysisPanel({
  isOpen,
  onClose,
  jobDescription,
  onJobDescriptionChange,
  onAnalyze,
  isAnalyzing,
  analysis,
}: AIAnalysisPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("recommendations");

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-600 dark:text-indigo-400" size={24} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Resume Analysis
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close panel"
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Job Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Description
            </label>
            <textarea
              placeholder="Paste the job description here to analyze your resume against it..."
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {jobDescription.length} characters
            </p>
          </div>

          {/* Analyze Button */}
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || !jobDescription.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Analyzing Resume...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Analyze Resume</span>
              </>
            )}
          </button>

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4 animate-fade-in">
              {/* Match Score */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
                    Match Score
                  </h3>
                </div>
                <div className="relative">
                  {/* Circular Progress */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysis.matchScore / 100)}`}
                          className={`transition-all duration-1000 ${
                            analysis.matchScore >= 70
                              ? "text-green-500"
                              : analysis.matchScore >= 50
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {analysis.matchScore}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {analysis.matchScore >= 70
                      ? "Great match! Your resume aligns well."
                      : analysis.matchScore >= 50
                      ? "Good start, but room for improvement."
                      : "Consider significant improvements."}
                  </p>
                </div>
              </div>

              {/* Missing Keywords */}
              {analysis.missingKeywords.length > 0 && (
                <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() =>
                      setExpandedSection(expandedSection === "keywords" ? null : "keywords")
                    }
                    className="w-full flex items-center justify-between"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
                      Missing Keywords ({analysis.missingKeywords.length})
                    </h3>
                    <span className="text-gray-500 dark:text-gray-400">
                      {expandedSection === "keywords" ? "−" : "+"}
                    </span>
                  </button>
                  {expandedSection === "keywords" && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {analysis.missingKeywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800 font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {analysis.suggestions.length > 0 && (
                <div className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === "recommendations" ? null : "recommendations"
                      )
                    }
                    className="w-full flex items-center justify-between"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                      Recommendations ({analysis.suggestions.length})
                    </h3>
                    <span className="text-gray-500 dark:text-gray-400">
                      {expandedSection === "recommendations" ? "−" : "+"}
                    </span>
                  </button>
                  {expandedSection === "recommendations" && (
                    <ul className="mt-4 space-y-3">
                      {analysis.suggestions.map((suggestion, idx) => (
                        <li
                          key={idx}
                          className="flex gap-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-xs font-semibold">
                            {idx + 1}
                          </span>
                          <span className="flex-1">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {!analysis && !isAnalyzing && (
            <div className="text-center py-12">
              <Sparkles size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Paste a job description and click Analyze to get AI-powered insights
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
