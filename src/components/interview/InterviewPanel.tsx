import { useState, useEffect } from "react";
import { Play, RotateCcw, Award, Loader2, TrendingUp, Target, AlertCircle } from "lucide-react";
import QuestionCard from "./QuestionCard";
import AnswerBox from "./AnswerBox";
import FeedbackCard from "./FeedbackCard";
import ProgressBar from "./ProgressBar";

interface InterviewPanelProps {
  currentSession: {
    id: string;
    role: string;
    company?: string;
    difficulty: string;
    placement_score?: number;
    strengths?: string[];
    weaknesses?: string[];
  } | null;
  onStartInterview: (role: string, company?: string) => Promise<void>;
  onGenerateQuestion: (difficulty: string) => Promise<{
    question: string;
    question_id: string;
  }>;
  onSubmitAnswer: (question_id: string, answer: string) => Promise<{
    score: number;
    feedback: string;
    strength: string;
    weakness: string;
    next_difficulty: string;
    average_score: number;
    placement_score: number;
  }>;
  onCalculateReadiness: () => Promise<{
    readiness_score: number;
    readiness_level: string;
    readiness_message: string;
  }>;
  onEndInterview: () => void;
}

interface QuestionData {
  text: string;
  id: string;
  difficulty: string;
}

interface FeedbackData {
  score: number;
  feedback: string;
  strength: string;
  weakness: string;
  previousDifficulty: string;
  nextDifficulty: string;
}

export default function InterviewPanel({
  currentSession,
  onStartInterview,
  onGenerateQuestion,
  onSubmitAnswer,
  onCalculateReadiness,
  onEndInterview,
}: InterviewPanelProps) {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackData | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [placementScore, setPlacementScore] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState("medium");
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [readinessResult, setReadinessResult] = useState<{
    readiness_score: number;
    readiness_level: string;
    readiness_message: string;
  } | null>(null);

  // Detect if session was restored
  useEffect(() => {
    if (currentSession && !interviewStarted) {
      setInterviewStarted(true);
      setRole(currentSession.role);
      setCompany(currentSession.company || "");
      setCurrentDifficulty(currentSession.difficulty);
      setPlacementScore(currentSession.placement_score || 0);
      setStrengths(currentSession.strengths || []);
      setWeaknesses(currentSession.weaknesses || []);
      // Optionally auto-load a question
      loadNextQuestion(currentSession.difficulty);
    }
  }, [currentSession]);

  const handleStartInterview = async () => {
    if (!role) return;

    setIsStarting(true);
    try {
      await onStartInterview(role, company || undefined);
      setInterviewStarted(true);
      setQuestionsAnswered(0);
      setAverageScore(0);
      setPlacementScore(0);
      setStrengths([]);
      setWeaknesses([]);
      setCurrentDifficulty("medium");
      await loadNextQuestion("medium");
    } catch (error) {
      console.error("Failed to start interview:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const loadNextQuestion = async (difficulty: string) => {
    setIsGenerating(true);
    setCurrentFeedback(null);
    try {
      const result = await onGenerateQuestion(difficulty);
      setCurrentQuestion({ 
        text: result.question, 
        id: result.question_id,
        difficulty 
      });
    } catch (error) {
      console.error("Failed to generate question:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!currentQuestion) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmitAnswer(currentQuestion.id, answer);
      setCurrentFeedback({
        score: result.score,
        feedback: result.feedback,
        strength: result.strength,
        weakness: result.weakness,
        previousDifficulty: currentQuestion.difficulty,
        nextDifficulty: result.next_difficulty,
      });
      setQuestionsAnswered(questionsAnswered + 1);
      setAverageScore(result.average_score);
      setPlacementScore(result.placement_score);
      setCurrentDifficulty(result.next_difficulty);
      
      // Update strengths and weaknesses
      setStrengths(prev => [...prev, result.strength]);
      setWeaknesses(prev => [...prev, result.weakness]);
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    await loadNextQuestion(currentDifficulty);
  };

  const handleFinishInterview = async () => {
    setIsCalculating(true);
    try {
      const result = await onCalculateReadiness();
      setReadinessResult(result);
      onEndInterview(); // Clear session from localStorage
    } catch (error) {
      console.error("Failed to calculate readiness:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRestart = () => {
    setInterviewStarted(false);
    setCurrentQuestion(null);
    setCurrentFeedback(null);
    setQuestionsAnswered(0);
    setAverageScore(0);
    setPlacementScore(0);
    setStrengths([]);
    setWeaknesses([]);
    setCurrentDifficulty("medium");
    setReadinessResult(null);
    setRole("");
    setCompany("");
    onEndInterview();
  };

  if (readinessResult) {
    const getScoreColor = (score: number) => {
      if (score >= 8) return "text-green-600 dark:text-green-400";
      if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
      return "text-red-600 dark:text-red-400";
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-xl p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Award size={32} />
              <h2 className="text-2xl font-bold">Interview Complete!</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-sm opacity-90 mb-1">Questions Answered</p>
              <p className="text-3xl font-bold">{questionsAnswered}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-sm opacity-90 mb-1">Average Score</p>
              <p className="text-3xl font-bold">{averageScore.toFixed(1)}/10</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-sm opacity-90 mb-1">Readiness Level</p>
              <p className="text-xl font-bold">{readinessResult.readiness_level}</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
            <p className={`text-5xl font-bold mb-2 ${getScoreColor(readinessResult.readiness_score)}`}>
              {readinessResult.readiness_score}/10
            </p>
            <p className="text-lg opacity-90">{readinessResult.readiness_message}</p>
          </div>
          
          <button
            onClick={handleRestart}
            className="w-full px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Start Adaptive Interview
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Target Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Choose a role...</option>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Product Manager">Product Manager</option>
                <option value="AI Engineer">AI Engineer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Company (Optional)
              </label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">General Interview</option>
                <option value="Google">Google</option>
                <option value="Amazon">Amazon</option>
                <option value="Microsoft">Microsoft</option>
                <option value="Meta">Meta</option>
                <option value="Apple">Apple</option>
                <option value="Netflix">Netflix</option>
              </select>
            </div>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Adaptive Interview Features:
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                  <span>AI-powered questions adapt to your skill level</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                  <span>Company-specific interview patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                  <span>Real-time feedback and strength/weakness tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                  <span>Placement readiness score calculation</span>
                </li>
              </ul>
            </div>
            
            <button
              onClick={handleStartInterview}
              disabled={!role || isStarting}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold"
            >
              {isStarting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Starting Interview...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Begin Adaptive Interview
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target size={20} />
            <span className="text-sm font-medium opacity-90">Placement Score</span>
          </div>
          <p className="text-3xl font-bold">{placementScore}/100</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} />
            <span className="text-sm font-medium opacity-90">Questions</span>
          </div>
          <p className="text-3xl font-bold">{questionsAnswered}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award size={20} />
            <span className="text-sm font-medium opacity-90">Avg Score</span>
          </div>
          <p className="text-3xl font-bold">{averageScore.toFixed(1)}/10</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={20} />
            <span className="text-sm font-medium opacity-90">Difficulty</span>
          </div>
          <p className="text-2xl font-bold capitalize">{currentDifficulty}</p>
        </div>
      </div>

      {/* Strengths and Weaknesses */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strengths.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">💪 Strengths</h3>
              <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                {strengths.slice(-3).map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {weaknesses.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">🎯 Areas to Improve</h3>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                {weaknesses.slice(-3).map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <ProgressBar
        current={questionsAnswered}
        total={5}
        score={averageScore}
      />
      
      {isGenerating ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <Loader2 size={48} className="animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Generating adaptive question...</p>
          {company && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Tailored for {company}</p>
          )}
        </div>
      ) : currentQuestion ? (
        <>
          <QuestionCard
            question={currentQuestion.text}
            difficulty={currentQuestion.difficulty}
            questionNumber={questionsAnswered + 1}
          />
          
          {!currentFeedback ? (
            <AnswerBox onSubmit={handleSubmitAnswer} isSubmitting={isSubmitting} />
          ) : (
            <>
              <FeedbackCard
                score={currentFeedback.score}
                feedback={currentFeedback.feedback}
                strength={currentFeedback.strength}
                weakness={currentFeedback.weakness}
                previousDifficulty={currentFeedback.previousDifficulty}
                nextDifficulty={currentFeedback.nextDifficulty}
              />
              
              <div className="flex gap-4">
                <button
                  onClick={handleNextQuestion}
                  disabled={questionsAnswered >= 5}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Next Question
                </button>
                <button
                  onClick={handleFinishInterview}
                  disabled={isCalculating || questionsAnswered < 1}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Award size={20} />
                      Finish & Get Score
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
