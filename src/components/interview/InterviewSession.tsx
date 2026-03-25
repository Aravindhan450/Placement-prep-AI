import { useState } from 'react';
import type { QuestionData, Evaluation } from '../../types/interview';

interface InterviewSessionProps {
  question: QuestionData;
  onSubmit: (answer: string) => void;
  feedback?: Evaluation | null;
  mentorInsight?: string | null;
  loading?: boolean;
  error?: string | null;
  difficultyChangeMessage?: string | null;
}

export default function InterviewSession({
  question,
  onSubmit,
  feedback,
  mentorInsight,
  loading = false,
  error,
  difficultyChangeMessage,
}: InterviewSessionProps) {
  const [answer, setAnswer] = useState<string>('');

  const handleSubmit = () => {
    if (!answer.trim() || loading) return;
    onSubmit(answer);
    setAnswer('');
  };

  return (
    <div className="space-y-6">
      {/* Topic and Difficulty Badges */}
      <div className="flex gap-3 flex-wrap items-center">
        {question.topic === "hr" ? (
          <>
            <span className="badge badge-purple">
              Behavioral Interview
            </span>
            <span className={`badge ${question.difficulty === 'hard' ? 'badge-red' : question.difficulty === 'medium' ? 'badge-amber' : 'badge-green'}`}>
              {question.difficulty}
            </span>
          </>
        ) : (
          <>
            <span className="badge badge-indigo">
              {question.topic}
            </span>
            <span className={`badge ${question.difficulty === 'hard' ? 'badge-red' : question.difficulty === 'medium' ? 'badge-amber' : 'badge-green'}`}>
              {question.difficulty}
            </span>
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Question Display */}
      <div className="glass-card p-8 border-l-4 border-indigo-500">
        <h2 className="text-xs text-indigo-400 tracking-widest mb-4 uppercase font-semibold">
          Question
        </h2>
        {difficultyChangeMessage && (
          <p className="text-sm text-amber-300 mb-3">
            {difficultyChangeMessage}
          </p>
        )}
        <p className="text-lg leading-relaxed text-gray-200">
          {question.question}
        </p>
      </div>

      {/* Answer Input */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-300">
          Your Answer:
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={6}
          disabled={loading}
          className="input-dark resize-y min-h-[150px]"
        />
      </div>

      {/* Submit Button */}
      <button
        className="btn-premium"
        onClick={handleSubmit}
        disabled={loading || !answer.trim()}
      >
        {loading ? 'Processing...' : 'Submit Answer →'}
      </button>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center gap-3 mt-4 p-4">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400">Analyzing your response...</span>
        </div>
      )}
    </div>
  );
}
