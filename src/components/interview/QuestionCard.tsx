import { MessageSquare } from "lucide-react";

interface QuestionCardProps {
  question: string;
  difficulty: string;
  questionNumber: number;
}

export default function QuestionCard({ question, difficulty, questionNumber }: QuestionCardProps) {
  const difficultyColors = {
    easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-gray-900 dark:text-white">
            Question {questionNumber}
          </span>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            difficultyColors[difficulty as keyof typeof difficultyColors] ||
            difficultyColors.medium
          }`}
        >
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
      </div>
      <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
        {question}
      </p>
    </div>
  );
}
