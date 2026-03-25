import { Send, Loader2 } from "lucide-react";
import { useState } from "react";

interface AnswerBoxProps {
  onSubmit: (answer: string) => void;
  isSubmitting: boolean;
}

export default function AnswerBox({ onSubmit, isSubmitting }: AnswerBoxProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer.trim());
      setAnswer("");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Your Answer
      </label>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey && !isSubmitting) {
            handleSubmit();
          }
        }}
        placeholder="Type your answer here... (Ctrl+Enter to submit)"
        rows={8}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        disabled={isSubmitting}
      />
      <div className="flex justify-between items-center mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {answer.length} characters
        </p>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !answer.trim()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <Send size={16} />
              Submit Answer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
