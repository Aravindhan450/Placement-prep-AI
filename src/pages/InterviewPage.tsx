import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InterviewStage, QuestionData, Evaluation, InterviewSession as InterviewSessionState } from '../types/interview';
import { supabase } from '../lib/supabase';
import InterviewSession from '../components/interview/InterviewSession';
import FeedbackPanel from '../components/interview/FeedbackPanel';

export default function InterviewPage() {
  const navigate = useNavigate();

  // Core Interview State
  const [stage, setStage] = useState<InterviewStage>("question");
  const [session, setSession] = useState<InterviewSessionState | null>(null);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [skillScore, setSkillScore] = useState<number>(0.5);
  const [mentorInsight, setMentorInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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

  // Generate first/next question when session is available
  useEffect(() => {
    if (!session) return;
    if (question) return;
    void generateQuestion(session);
  }, [session, question]);

  // Generate question function
  async function generateQuestion(activeSession: InterviewSessionState) {
    if (activeSession.questionIndex >= activeSession.totalQuestions) {
      navigate("/summary");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.functions.invoke("generate-question", {
      body: {
        topic: activeSession.topic
      }
    });
    setLoading(false);

    if (!error && data) {
      setQuestion({
        topic: data.topic,
        difficulty: data.difficulty,
        question: data.question
      });
      setSkillScore(data.skill_score || 0.5);
      setStage("question");
    }
  }

  // Submit answer function
  async function submitAnswer(answer: string) {
    if (!session || !question) return;

    setLoading(true);
    // Step 1: Evaluate answer
    const { data: evalData } = await supabase.functions.invoke("evaluate-answer", {
      body: { 
        userAnswer: answer,
        question: question.question,
        topic: session.topic,
        difficulty: question.difficulty,
        company: null,
        role: null,
        expectedConcepts: [],
        previousMistakes: [],
      }
    });

    if (evalData && evalData.evaluation) {
      setEvaluation(evalData.evaluation);

      // Step 2: Update skill
      await supabase.functions.invoke("update-skill", {
        body: {
          topic: session.topic,
          evaluation: evalData.evaluation
        }
      });

      // Step 3: Generate insight
      const { data: insightData } = await supabase.functions.invoke("generate-insight", {
        body: { topic: session.topic }
      });

      if (insightData && insightData.insight) {
        setMentorInsight(insightData.insight);
      }

      // Step 4: Increment session progress
      const updatedSession: InterviewSessionState = {
        ...session,
        questionIndex: session.questionIndex + 1
      };
      setSession(updatedSession);
      localStorage.setItem("activeInterviewSession", JSON.stringify(updatedSession));

      // Step 5: End interview at exactly 10 questions
      if (updatedSession.questionIndex === updatedSession.totalQuestions) {
        navigate("/summary");
        return;
      }

      // Step 4: Move to feedback stage
      setStage("feedback");
      setQuestion(null);
      setLoading(false);

      // Step 6: Auto-generate next question after 3 seconds
      setTimeout(() => {
        void generateQuestion(updatedSession);
      }, 3000);
      return;
    }

    setLoading(false);
  }

  function handleBack() {
    localStorage.removeItem("activeInterviewSession");
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
  const progressPercent = ((Math.min(session.questionIndex + 1, session.totalQuestions)) / session.totalQuestions) * 100;

  if (stage === "question" && question) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors group"
        >
          <svg 
            className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Topics</span>
        </button>

        <div className="glass-card p-8 space-y-6">
          {/* Session Progress */}
          <div className="mb-6">
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

          {/* Skill Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                Current Skill Level
              </span>
              <span className="text-indigo-400 font-semibold">
                {Math.round(skillScore * 100)}%
              </span>
            </div>
            <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" 
                style={{ width: `${skillScore * 100}%` }}
              />
            </div>
          </div>

          <InterviewSession
            question={question}
            onSubmit={submitAnswer}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  if (stage === "feedback" && evaluation) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors group"
        >
          <svg 
            className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Topics</span>
        </button>

        <div className="glass-card p-8 space-y-6">
          {/* Session Progress */}
          <div className="mb-6">
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

          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Answer Evaluation
          </h2>
          
          {/* Updated Skill Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                Updated Skill Level
              </span>
              <span className="text-green-400 font-semibold">
                {Math.round(skillScore * 100)}%
              </span>
            </div>
            <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 pulse-glow transition-all duration-1000" 
                style={{ width: `${skillScore * 100}%` }}
              />
            </div>
          </div>

          <FeedbackPanel 
            evaluation={evaluation} 
            mentorInsight={mentorInsight}
          />

          <div className="glass-card p-6 text-center border-indigo-500/30">
            <p className="text-gray-400 text-sm">
              ⏳ Next question loading in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Interview Page</h1>
      <p>Current Stage: {stage}</p>
    </div>
  );
}
