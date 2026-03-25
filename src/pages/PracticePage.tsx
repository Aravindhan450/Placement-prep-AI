import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InterviewStage, QuestionData, Evaluation, InterviewSession as InterviewSessionState } from '../types/interview';
import { supabase } from '../lib/supabase';
import InterviewSession from '../components/interview/InterviewSession';
import FeedbackPanel from '../components/interview/FeedbackPanel';
import {
  appendSessionScore,
  clearActiveSessionAnalytics,
  saveActiveSessionAnalytics,
  startInterviewSession,
} from '../services/interviewSessionApi';

export default function PracticePage() {
  const navigate = useNavigate();

  const [stage, setStage] = useState<InterviewStage>("question");
  const [session, setSession] = useState<InterviewSessionState | null>(null);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [skillScore, setSkillScore] = useState<number>(0.5);
  const [mentorInsight, setMentorInsight] = useState<string | null>(null);
  const [difficultyChangeMessage, setDifficultyChangeMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewAnalyticsSessionId, setInterviewAnalyticsSessionId] = useState<string | null>(null);

  // ✅ Track previous mistakes for system memory
  const previousMistakes = useRef<string[]>([]);
  // ✅ Track previous questions to avoid repeats
  const previousQuestions = useRef<string[]>([]);
  // ✅ Store current answer for passing to evaluator
  const currentAnswer = useRef<string>("");

  // Load active session on mount
  useEffect(() => {
    const saved = localStorage.getItem("activeInterviewSession");
    if (!saved) {
      navigate("/");
      return;
    }
    try {
      const parsed = JSON.parse(saved) as InterviewSessionState;
      setSession(parsed);
    } catch {
      localStorage.removeItem("activeInterviewSession");
      navigate("/");
    }
  }, [navigate]);

  // Generate first question when session loads
  useEffect(() => {
    if (!session) return;
    if (question) return;
    void generateQuestion(session);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    if (interviewAnalyticsSessionId) return;
    const activeSession = session;

    async function createInterviewSession() {
      try {
        const sessionId = await startInterviewSession({
          company: null,
          role: null,
          topic: activeSession.topic,
        });
        setInterviewAnalyticsSessionId(sessionId);
        saveActiveSessionAnalytics({ session_id: sessionId, scores: [] });
      } catch (e) {
        console.error("Failed to start interview analytics session:", e);
      }
    }

    void createInterviewSession();
  }, [session, interviewAnalyticsSessionId]);

  // ✅ Get access token from session
  async function getAccessToken(): Promise<string> {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) throw new Error("Not authenticated");
    return authSession.access_token;
  }

  // ✅ Generate question — passes previousQuestions to avoid repeats
  async function generateQuestion(
    activeSession: InterviewSessionState,
    options?: { reinforce?: boolean; previousMistake?: string; difficulty?: 'easy' | 'medium' | 'hard' }
  ): Promise<{ skill_score: number } | null> {
    if (activeSession.questionIndex >= activeSession.totalQuestions) {
      navigate("/summary");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const { data, error: fnError } = await supabase.functions.invoke("generate-question", {
        body: {
          topic: activeSession.topic,
          accessToken,
          difficulty: options?.difficulty ?? null,
          reinforce: options?.reinforce ?? false,
          previousMistake: options?.previousMistake ?? "",
          previousQuestions: previousQuestions.current,
        }
      });

      if (fnError || !data?.question) throw new Error(fnError?.message ?? "Failed to generate question");

      // Track this question
      previousQuestions.current = [...previousQuestions.current, data.question];

      setQuestion({
        topic: data.topic,
        difficulty: data.difficulty,
        question: data.question,
      });
      setSkillScore(data.skill_score ?? 0.5);
      setStage("question");
      return { skill_score: Number(data.skill_score ?? 0.5) };
    } catch (e: any) {
      setError(e.message ?? "Failed to generate question");
      return null;
    } finally {
      setLoading(false);
    }
  }

  // ✅ Submit answer — passes full context to evaluator (Blind Evaluator fix)
  async function submitAnswer(answer: string) {
    if (!session || !question) return;

    currentAnswer.current = answer;
    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();

      // Step 1: Evaluate with full context
      const { data: evalData, error: evalError } = await supabase.functions.invoke("evaluate-answer", {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          userAnswer: answer,
          question: question.question,       // ✅ THE FIX
          topic: session.topic,
          difficulty: question.difficulty,   // ✅ context-aware scoring
          previousMistakes: previousMistakes.current, // ✅ system memory
        }
      });

      if (evalError || !evalData?.evaluation) throw new Error("Evaluation failed");

      const eval_ = evalData.evaluation as Evaluation;
      setEvaluation(eval_);
      const score =
        (eval_.correctness + eval_.concept_depth + eval_.confidence + eval_.clarity) / 4;
      appendSessionScore(score);

      // ✅ Track mistakes from feedback for system memory
      if (eval_.feedback && eval_.correctness < 0.6) {
        previousMistakes.current = [
          ...previousMistakes.current.slice(-4),
          eval_.feedback,
        ];
      }

      // Step 2: Update skill
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.functions.invoke("update-skill", {
        body: {
          user_id: user?.id,
          session_id: interviewAnalyticsSessionId,
          topic: session.topic,
          difficulty: question.difficulty,
          evaluation: eval_,
          accessToken,
        }
      });

      // Step 3: Generate mentor insight
      try {
        const { data: insightData } = await supabase.functions.invoke("generate-insight", {
          body: { topic: session.topic, accessToken }
        });
        if (insightData?.insight) setMentorInsight(insightData.insight);
      } catch {
        // Non-critical — don't fail the whole flow
      }

      // Step 4: Increment session progress
      const updatedSession: InterviewSessionState = {
        ...session,
        questionIndex: session.questionIndex + 1,
      };
      setSession(updatedSession);
      localStorage.setItem("activeInterviewSession", JSON.stringify(updatedSession));

      // Step 5: End interview at 10 questions
      if (updatedSession.questionIndex >= updatedSession.totalQuestions) {
        navigate("/summary");
        return;
      }

      // ✅ Step 6: Show feedback, let USER click Next (no more setTimeout)
      setStage("feedback");

    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Manual next question — triggered by button click
  async function handleNextQuestion() {
    if (!session) return;
    const previousSkill = skillScore;
    setEvaluation(null);
    setMentorInsight(null);
    setQuestion(null);
    setStage("question");
    const nextQuestionData = await generateQuestion(session);
    if (!nextQuestionData) return;

    if (nextQuestionData.skill_score > previousSkill) {
      setDifficultyChangeMessage("Difficulty increased because your performance improved.");
    } else if (nextQuestionData.skill_score < previousSkill) {
      setDifficultyChangeMessage("We adjusted difficulty to reinforce fundamentals.");
    } else {
      setDifficultyChangeMessage(null);
    }
  }

  async function handlePracticeSimilarQuestion() {
    if (!session || !question || !evaluation) return;
    const previousSkill = skillScore;
    setStage("question");
    setQuestion(null);
    setMentorInsight(null);
    setError(null);
    const nextQuestionData = await generateQuestion(session, {
      reinforce: true,
      previousMistake: evaluation.feedback,
      difficulty: question.difficulty,
    });
    if (!nextQuestionData) return;

    if (nextQuestionData.skill_score > previousSkill) {
      setDifficultyChangeMessage("Difficulty increased because your performance improved.");
    } else if (nextQuestionData.skill_score < previousSkill) {
      setDifficultyChangeMessage("We adjusted difficulty to reinforce fundamentals.");
    } else {
      setDifficultyChangeMessage(null);
    }
  }

  function handleBack() {
    localStorage.removeItem("activeInterviewSession");
    clearActiveSessionAnalytics();
    navigate("/");
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center text-gray-400">
        Loading interview session...
      </div>
    );
  }

  const progressLabel = `Q ${Math.min(session.questionIndex + 1, session.totalQuestions)} / ${session.totalQuestions}`;
  const progressPercent = (Math.min(session.questionIndex + 1, session.totalQuestions) / session.totalQuestions) * 100;

  // ── Shared header ──────────────────────────────────────────────────────────
  const PageHeader = () => (
    <>
      <button
        onClick={handleBack}
        className="mb-4 flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors group"
      >
        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to Topics</span>
      </button>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Session progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Session Progress</span>
          <span className="text-indigo-400 font-semibold">{progressLabel}</span>
        </div>
        <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Skill score */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Skill Level</span>
          <span className="text-indigo-400 font-semibold">{Math.round(skillScore * 100)}%</span>
        </div>
        <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
            style={{ width: `${skillScore * 100}%` }}
          />
        </div>
      </div>
    </>
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading && !question && stage === "question") {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <PageHeader />
        <div className="glass-card p-8 flex flex-col items-center gap-4 text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Generating your next question...</p>
        </div>
      </div>
    );
  }

  // ── Question stage ─────────────────────────────────────────────────────────
  if (stage === "question" && question) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <PageHeader />
        <div className="glass-card p-8 space-y-6">
          <InterviewSession
            question={question}
            onSubmit={submitAnswer}
            loading={loading}
            difficultyChangeMessage={difficultyChangeMessage}
          />
        </div>
      </div>
    );
  }

  // ── Feedback stage ─────────────────────────────────────────────────────────
  if (stage === "feedback" && evaluation) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <PageHeader />
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Answer Evaluation
          </h2>

          <FeedbackPanel
            evaluation={evaluation}
            mentorInsight={mentorInsight}
            onPracticeSimilar={handlePracticeSimilarQuestion}
            practiceLoading={loading}
          />

          {/* ✅ Manual next button — no more 3s auto-advance */}
          <button
            onClick={handleNextQuestion}
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl font-semibold text-white
              bg-gradient-to-r from-indigo-500 to-purple-500
              hover:from-indigo-600 hover:to-purple-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading next question...
              </>
            ) : (
              <>
                Next Question ({Math.min(session.questionIndex + 1, session.totalQuestions)}/{session.totalQuestions}) →
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 text-center text-gray-400">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p>Preparing interview...</p>
    </div>
  );
}
