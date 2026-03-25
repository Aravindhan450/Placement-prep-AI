import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDashboardContext } from "../contexts/DashboardContext";
import { supabase } from "../lib/supabase";
import {
  appendSessionScore,
  calculateAverageScore,
  clearActiveSessionAnalytics,
  endInterviewSession,
  saveActiveSessionAnalytics,
  startInterviewSession,
} from "../services/interviewSessionApi";

type Phase = "company" | "role" | "interview" | "feedback" | "summary";
type Difficulty = "easy" | "medium" | "hard";

interface Evaluation {
  correctness: number;
  concept_depth: number;
  confidence: number;
  clarity: number;
  feedback: string;
}

interface SessionEntry {
  qNum: number;
  question: string;
  answer: string;
  evaluation: Evaluation;
  difficulty: string;
}

interface Company {
  id: string;
  label: string;
  color: string;
  desc: string;
}

interface Option {
  id: string;
  label: string;
  desc?: string;
}

interface GenerateCompanyQuestionResult {
  question: string;
  difficulty: Difficulty;
  skill_score: number;
  question_id: string;
}

const COMPANIES: Company[] = [
  { id: "google",    label: "Google",    color: "#4285f4", desc: "Algorithms · System Design · Googleyness" },
  { id: "amazon",    label: "Amazon",    color: "#ff9900", desc: "Leadership Principles · DSA · Scalability" },
  { id: "microsoft", label: "Microsoft", color: "#00a4ef", desc: "Problem Solving · OOP · Culture Fit" },
  { id: "flipkart",  label: "Flipkart",  color: "#2874f0", desc: "SQL · Backend · E-Commerce Systems" },
];

const ROLES: Option[] = [
  { id: "sde",              label: "SDE / Software Engineer" },
  { id: "data_analyst",     label: "Data Analyst" },
  { id: "product_manager",  label: "Product Manager" },
  { id: "data_scientist",   label: "Data Scientist" },
];

const ROUND_TYPES: Option[] = [
  { id: "dsa",           label: "DSA Round",          desc: "Arrays, Trees, DP, Graphs" },
  { id: "system_design", label: "System Design",      desc: "Scalability, Architecture" },
  { id: "behavioral",    label: "Behavioral",         desc: "Leadership, Situational" },
  { id: "domain",        label: "Domain / Technical", desc: "Role-specific deep dive" },
];

const TOTAL_QUESTIONS = 10;
const QUESTION_TIME_SECONDS = 120;

// ✅ Centralized token helper
const getAccessToken = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not logged in");
  return session.access_token;
};

const difficultyColor = (level: string): string => {
  if (level === "easy") return "#4ade80";
  if (level === "hard") return "#f87171";
  return "#fbbf24";
};

const mean = (vals: number[]): number => {
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

export default function InterviewSimulationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadDashboardData } = useDashboardContext();

  const [phase, setPhase] = useState<Phase>("company");
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<string>("");
  const [roundType, setRoundType] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [skillScore, setSkillScore] = useState<number>(0.5);
  const [answer, setAnswer] = useState<string>("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [questionNum, setQuestionNum] = useState<number>(1);
  const [sessionLog, setSessionLog] = useState<SessionEntry[]>([]);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number>(QUESTION_TIME_SECONDS);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [interviewAnalyticsSessionId, setInterviewAnalyticsSessionId] = useState<string | null>(null);

  // ✅ System memory — tracks weak areas across questions
  const previousMistakes = useRef<string[]>([]);
  const summarySynced = useRef<boolean>(false);

  useEffect(() => {
    const styleId = "company-interview-fonts";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700;800&display=swap');
      @keyframes ciSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes ciPulse { 0% { transform: scale(1); } 50% { transform: scale(1.04);} 100% { transform: scale(1);} }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((s) => {
        if (s <= 1) { clearInterval(interval); setTimerRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  // ✅ Generate question — uses Authorization header
  const generateQuestion = async (
    companyId: string,
    roleId: string,
    roundTypeId: string,
    prevQuestions: string[]
  ): Promise<GenerateCompanyQuestionResult> => {
    const accessToken = await getAccessToken();
    const { data, error: fnError } = await supabase.functions.invoke<GenerateCompanyQuestionResult>(
      "generate-company-question",
      {
        body: { company: companyId, role: roleId, roundType: roundTypeId, accessToken, previousQuestions: prevQuestions },
      }
    );
    if (fnError) throw fnError;
    if (!data) throw new Error("No question response received");
    return data;
  };

  // ✅ Evaluate — passes full context + system memory, uses Authorization header
  const evaluateAnswer = async (
    userAnswer: string,
    questionText: string,
    topicStr: string,
    diff: string,
    companyId: string,
    roleId: string
  ): Promise<Evaluation> => {
    const accessToken = await getAccessToken();
    const { data, error: fnError } = await supabase.functions.invoke<{ evaluation: Evaluation }>(
      "evaluate-answer",
      {
        headers: { Authorization: `Bearer ${accessToken}` }, // ✅ header auth
        body: {
          userAnswer,
          question: questionText,                          // ✅ blind evaluator fix
          topic: topicStr,
          difficulty: diff,                                // ✅ context-aware scoring
          company: companyId,                              // ✅ company-specific feedback
          role: roleId,
          expectedConcepts: [],
          previousMistakes: previousMistakes.current,     // ✅ system memory
        },
      }
    );
    if (fnError) throw fnError;
    if (!data?.evaluation) throw new Error("No evaluation received");
    return data.evaluation;
  };

  // ✅ Update skill — uses Authorization header
  const updateSkill = async (
    userId: string,
    companyId: string,
    roleId: string,
    diff: string,
    eval_: Evaluation,
    sessionId: string | null
  ): Promise<void> => {
    const accessToken = await getAccessToken();
    const { error: fnError } = await supabase.functions.invoke("update-skill", {
      body: {
        user_id: userId,
        session_id: sessionId,
        topic: `${companyId}_${roleId}`,
        difficulty: diff,
        evaluation: eval_,
        accessToken,
      },
    });
    if (fnError) throw fnError;
  };

  const startInterview = async (): Promise<void> => {
    if (!company || !role || !roundType) return;
    setLoading(true);
    setError(null);
    setPhase("interview");
    setQuestionNum(1);
    setSessionLog([]);
    setPreviousQuestions([]);
    setInterviewAnalyticsSessionId(null);
    setAnswer("");
    setEvaluation(null);
    previousMistakes.current = []; // ✅ reset memory on new session
    summarySynced.current = false;

    try {
      const analyticsSessionId = await startInterviewSession({
        company: company.id,
        role,
        topic: roundType,
      });
      setInterviewAnalyticsSessionId(analyticsSessionId);
      saveActiveSessionAnalytics({ session_id: analyticsSessionId, scores: [] });

      const result = await generateQuestion(company.id, role, roundType, []);
      setQuestion(result.question);
      setDifficulty(result.difficulty);
      setSkillScore(result.skill_score);
      setTimerSeconds(QUESTION_TIME_SECONDS);
      setTimerRunning(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start interview");
      setPhase("role");
    } finally {
      setLoading(false);
    }
  };

  const submitCurrentAnswer = async (): Promise<void> => {
    if (!user || !company || !answer.trim()) return;

    setLoading(true);
    setError(null);
    setTimerRunning(false);

    try {
      const evalResult = await evaluateAnswer(
        answer,
        question,                    // ✅ passing actual question
        `${company.id}_${role}`,
        difficulty,
        company.id,
        role
      );

      // ✅ System memory — store feedback from weak answers
      if (evalResult.correctness < 0.6 && evalResult.feedback) {
        previousMistakes.current = [
          ...previousMistakes.current.slice(-4),
          evalResult.feedback,
        ];
      }
      const score =
        (evalResult.correctness + evalResult.concept_depth + evalResult.confidence + evalResult.clarity) / 4;
      appendSessionScore(score);

      await updateSkill(user.id, company.id, role, difficulty, evalResult, interviewAnalyticsSessionId);

      setEvaluation(evalResult);
      setSessionLog((prev) => [
        ...prev,
        { qNum: questionNum, question, answer, evaluation: evalResult, difficulty },
      ]);
      setPreviousQuestions((prev) => [...prev, question]);
      setPhase("feedback");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit answer");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Manual next question — no auto-advance
  const nextQuestion = async (): Promise<void> => {
    if (!company) return;

    if (questionNum >= TOTAL_QUESTIONS) {
      if (user?.id) {
        try {
          await supabase.rpc("recompute_readiness", {
            p_user: user.id,
          });
        } catch (err) {
          console.error("Readiness recompute failed", err);
        }
      }
      window.dispatchEvent(new Event("dashboard-refresh"));
      setPhase("summary");
      return;
    }

    const nextNum = questionNum + 1;
    setPhase("interview");
    setAnswer("");
    setEvaluation(null);
    setLoading(true);
    setError(null);

    try {
      const nextPrevQuestions = [...previousQuestions, question];
      const result = await generateQuestion(company.id, role, roundType, nextPrevQuestions);
      setQuestionNum(nextNum);
      setQuestion(result.question);
      setDifficulty(result.difficulty);
      setSkillScore(result.skill_score);
      setTimerSeconds(QUESTION_TIME_SECONDS);
      setTimerRunning(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load next question");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = (): void => {
    setPhase("company");
    setCompany(null);
    setRole("");
    setRoundType("");
    setQuestion("");
    setDifficulty("medium");
    setSkillScore(0.5);
    setAnswer("");
    setEvaluation(null);
    setError(null);
    setQuestionNum(1);
    setSessionLog([]);
    setPreviousQuestions([]);
    setTimerSeconds(QUESTION_TIME_SECONDS);
    setTimerRunning(false);
    setInterviewAnalyticsSessionId(null);
    previousMistakes.current = [];
    summarySynced.current = false;
    clearActiveSessionAnalytics();
  };

  const timerPct = (timerSeconds / QUESTION_TIME_SECONDS) * 100;
  const timerColor = timerPct > 50 ? "#4ade80" : timerPct > 20 ? "#fbbf24" : "#f87171";

  const overallFeedbackScore = useMemo(() => {
    if (!evaluation) return 0;
    return Math.round(
      ((evaluation.correctness + evaluation.concept_depth + evaluation.confidence + evaluation.clarity) / 4) * 100
    );
  }, [evaluation]);

  const summaryAverage = useMemo(() => {
    const scores = sessionLog.map((e) =>
      ((e.evaluation.correctness + e.evaluation.concept_depth + e.evaluation.confidence + e.evaluation.clarity) / 4) * 100
    );
    return Math.round(mean(scores));
  }, [sessionLog]);

  const strongestMetric = useMemo(() => {
    const metrics = {
      correctness:   mean(sessionLog.map((s) => s.evaluation.correctness)),
      concept_depth: mean(sessionLog.map((s) => s.evaluation.concept_depth)),
      confidence:    mean(sessionLog.map((s) => s.evaluation.confidence)),
      clarity:       mean(sessionLog.map((s) => s.evaluation.clarity)),
    };
    return Object.entries(metrics).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  }, [sessionLog]);

  useEffect(() => {
    if (phase !== "summary") return;
    if (!interviewAnalyticsSessionId) return;
    if (summarySynced.current) return;

    summarySynced.current = true;
    const scores = sessionLog.map(
      (entry) =>
        (entry.evaluation.correctness +
          entry.evaluation.concept_depth +
          entry.evaluation.confidence +
          entry.evaluation.clarity) /
        4
    );
    const avg = calculateAverageScore(scores);
    const sessionId = interviewAnalyticsSessionId;

    async function finalizeAndRefreshDashboard() {
      try {
        await endInterviewSession(sessionId, avg, sessionLog.length);
      } catch (e) {
        console.error("Failed to finalize interview session:", e);
      } finally {
        clearActiveSessionAnalytics();
      }

      try {
        await loadDashboardData();
      } catch (e) {
        console.error("Failed to refresh dashboard data after interview completion:", e);
      }

      window.dispatchEvent(new Event("dashboard-refresh"));
    }

    void finalizeAndRefreshDashboard();
  }, [phase, interviewAnalyticsSessionId, loadDashboardData, sessionLog]);

  const renderSpinner = () => (
    <div style={styles.spinnerWrap}>
      <div style={styles.spinner} />
      <span style={styles.mutedText}>Loading...</span>
    </div>
  );

  const renderError = () =>
    error ? (
      <div style={styles.errorBox}>
        <strong style={{ color: "#fecaca" }}>Error:</strong> <span>{error}</span>
      </div>
    ) : null;

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />
      <div style={styles.gridOverlay} />

      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Company Interview Simulator</h1>
          <p style={styles.subtitle}>Adaptive placement rounds based on company style, role, and performance.</p>
        </header>

        {renderError()}

        {/* ── COMPANY SELECTION ── */}
        {phase === "company" && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>1. Select Company</h2>
            <div style={styles.companyGrid}>
              {COMPANIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCompany(c); setPhase("role"); setError(null); }}
                  style={{ ...styles.companyCard, borderLeft: `4px solid ${c.color}` }}
                >
                  <div style={styles.companyName}>{c.label}</div>
                  <div style={styles.companyDesc}>{c.desc}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── ROLE + ROUND SELECTION ── */}
        {phase === "role" && company && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>2. Pick Role & Round</h2>
            <p style={styles.mutedText}>
              Selected company: <strong style={{ color: company.color }}>{company.label}</strong>
            </p>

            <div style={styles.selectorGrid}>
              <div>
                <p style={styles.selectorHeading}>Role</p>
                <div style={styles.optionGrid}>
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      style={{ ...styles.optionCard, ...(role === r.id ? styles.optionCardActive : {}) }}
                    >
                      <div style={styles.optionTitle}>{r.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p style={styles.selectorHeading}>Round Type</p>
                <div style={styles.optionGrid}>
                  {ROUND_TYPES.map((rt) => (
                    <button
                      key={rt.id}
                      onClick={() => setRoundType(rt.id)}
                      style={{ ...styles.optionCard, ...(roundType === rt.id ? styles.optionCardActive : {}) }}
                    >
                      <div style={styles.optionTitle}>{rt.label}</div>
                      <div style={styles.optionDesc}>{rt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.actionRow}>
              <button style={styles.secondaryBtn} onClick={() => setPhase("company")}>← Back</button>
              <button
                style={{ ...styles.primaryBtn, ...(!(role && roundType) || loading ? styles.disabledBtn : {}) }}
                onClick={startInterview}
                disabled={!(role && roundType) || loading}
              >
                {loading ? "Starting..." : "Start Interview →"}
              </button>
            </div>
            {loading && renderSpinner()}
          </section>
        )}

        {/* ── INTERVIEW ── */}
        {phase === "interview" && company && (
          <section style={styles.card}>
            <div style={styles.topMeta}>
              <div>
                <p style={styles.metaLabel}>{company.label} · {role} · {roundType}</p>
                <p style={styles.metaQuestionCount}>Question {questionNum} / {TOTAL_QUESTIONS}</p>
              </div>
              <div style={styles.badgeRow}>
                <span style={{
                  ...styles.difficultyBadge,
                  backgroundColor: `${difficultyColor(difficulty)}22`,
                  color: difficultyColor(difficulty),
                }}>
                  {difficulty.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Progress dots */}
            <div style={styles.progressDotsRow}>
              {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => {
                const n = idx + 1;
                return (
                  <div
                    key={n}
                    style={{
                      ...styles.progressDot,
                      ...(n < questionNum ? styles.progressDotDone : {}),
                      ...(n === questionNum ? styles.progressDotCurrent : {}),
                    }}
                  />
                );
              })}
            </div>

            {/* Timer + Skill */}
            <div style={styles.timerSkillRow}>
              <div style={styles.timerWrap}>
                <svg width="84" height="84" viewBox="0 0 84 84">
                  <circle cx="42" cy="42" r="34" stroke="#1a1a2e" strokeWidth="8" fill="none" />
                  <circle
                    cx="42" cy="42" r="34"
                    stroke={timerColor} strokeWidth="8" fill="none"
                    strokeLinecap="round"
                    transform="rotate(-90 42 42)"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={(2 * Math.PI * 34 * (100 - timerPct)) / 100}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div style={styles.timerCenter}>{timerSeconds}s</div>
              </div>

              <div style={{ flex: 1 }}>
                <p style={styles.skillLabel}>Skill Score: {Math.round(skillScore * 100)}%</p>
                <div style={styles.skillTrack}>
                  <div style={{ ...styles.skillFill, width: `${Math.max(2, skillScore * 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Question */}
            <div style={{ ...styles.questionCard, boxShadow: `inset 0 2px 0 ${difficultyColor(difficulty)}` }}>
              {loading && !question ? (
                renderSpinner()
              ) : (
                <p style={styles.questionText}>{question || "Generating your question..."}</p>
              )}
            </div>

            {/* Answer */}
            <div style={styles.answerWrap}>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your answer clearly. Mention approach, tradeoffs, and reasoning."
                style={styles.answerInput}
                disabled={loading}
                rows={7}
              />
              <div style={styles.charCount}>{answer.length} chars</div>
            </div>

            <div style={styles.actionRow}>
              <button
                style={{ ...styles.primaryBtn, ...(loading || !answer.trim() ? styles.disabledBtn : {}) }}
                onClick={submitCurrentAnswer}
                disabled={loading || !answer.trim()}
              >
                {loading ? "Submitting..." : "Submit Answer →"}
              </button>
            </div>

            {loading && renderSpinner()}
          </section>
        )}

        {/* ── FEEDBACK ── */}
        {phase === "feedback" && evaluation && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Feedback — Q{questionNum}/{TOTAL_QUESTIONS}</h2>

            <div style={styles.feedbackTop}>
              <div style={styles.scoreRingWrap}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" stroke="#1a1a2e" strokeWidth="10" fill="none" />
                  <circle
                    cx="60" cy="60" r="50"
                    stroke="#6366f1" strokeWidth="10" fill="none"
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={(2 * Math.PI * 50 * (100 - overallFeedbackScore)) / 100}
                  />
                </svg>
                <div style={styles.scoreRingCenter}>{overallFeedbackScore}</div>
              </div>

              <div style={styles.feedbackTextBox}>
                <p style={styles.metricTitle}>AI Feedback</p>
                <p style={styles.feedbackText}>{evaluation.feedback}</p>
              </div>
            </div>

            <div style={styles.metricGrid}>
              {[
                { key: "Correctness",   value: evaluation.correctness },
                { key: "Concept Depth", value: evaluation.concept_depth },
                { key: "Confidence",    value: evaluation.confidence },
                { key: "Clarity",       value: evaluation.clarity },
              ].map((m) => (
                <div key={m.key} style={styles.metricRow}>
                  <div style={styles.metricHead}>
                    <span style={styles.metricName}>{m.key}</span>
                    <span style={styles.metricValue}>{Math.round(m.value * 100)}%</span>
                  </div>
                  <div style={styles.metricTrack}>
                    <div style={{ ...styles.metricFill, width: `${Math.round(m.value * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ Manual Next button — no auto-advance */}
            <div style={styles.actionRow}>
              <button style={styles.secondaryBtn} onClick={resetAll}>Exit</button>
              <button
                style={{ ...styles.primaryBtn, ...(loading ? styles.disabledBtn : {}) }}
                onClick={nextQuestion}
                disabled={loading}
              >
                {loading
                  ? "Loading..."
                  : questionNum >= TOTAL_QUESTIONS
                  ? "View Summary →"
                  : `Next Question (${questionNum + 1}/${TOTAL_QUESTIONS}) →`}
              </button>
            </div>
            {loading && renderSpinner()}
          </section>
        )}

        {/* ── SUMMARY ── */}
        {phase === "summary" && (
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Session Summary</h2>

            <div style={styles.summaryStatsGrid}>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Average Score</p>
                <p style={styles.statValue}>{summaryAverage}%</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Questions</p>
                <p style={styles.statValue}>{sessionLog.length}</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Strongest Metric</p>
                <p style={{ ...styles.statValue, textTransform: "capitalize", fontSize: "20px" }}>
                  {strongestMetric.replace("_", " ")}
                </p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Hard Questions</p>
                <p style={{ ...styles.statValue, color: "#f87171" }}>
                  {sessionLog.filter(e => e.difficulty === "hard").length}
                </p>
              </div>
            </div>

            <div style={styles.summaryList}>
              {sessionLog.map((entry) => {
                const entryScore = Math.round(
                  ((entry.evaluation.correctness + entry.evaluation.concept_depth +
                    entry.evaluation.confidence + entry.evaluation.clarity) / 4) * 100
                );
                const barColor = entryScore >= 75 ? "#4ade80" : entryScore >= 50 ? "#fbbf24" : "#f87171";

                return (
                  <div key={entry.qNum} style={styles.summaryRow}>
                    <div style={styles.summaryRowHead}>
                      <span style={styles.summaryQLabel}>Q{entry.qNum}</span>
                      <span style={styles.summaryQMeta}>
                        {entry.difficulty.toUpperCase()} · {entryScore}%
                      </span>
                    </div>
                    <div style={styles.summaryTrack}>
                      <div style={{ ...styles.summaryFill, width: `${entryScore}%`, background: barColor }} />
                    </div>
                    {/* ✅ Show feedback per question in summary */}
                    <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                      {entry.evaluation.feedback}
                    </p>
                  </div>
                );
              })}
            </div>

            <div style={styles.actionRow}>
              <button style={styles.secondaryBtn} onClick={resetAll}>← New Company</button>
              <button style={styles.primaryBtn} onClick={startInterview}>Retry Same Setup →</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", backgroundColor: "#07070f", color: "#e2e2f0", position: "relative", overflow: "hidden", fontFamily: "'Syne', sans-serif" },
  overlay: { position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 50% at 15% 15%, #6366f118, transparent 55%), radial-gradient(ellipse 50% 60% at 85% 85%, #a78bfa12, transparent 55%)" },
  gridOverlay: { position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(#ffffff03 1px, transparent 1px), linear-gradient(90deg, #ffffff03 1px, transparent 1px)", backgroundSize: "48px 48px" },
  container: { position: "relative", zIndex: 1, maxWidth: "960px", margin: "0 auto", padding: "32px 16px 64px" },
  header: { marginBottom: "18px" },
  title: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "42px", margin: 0, letterSpacing: "-0.02em" },
  subtitle: { color: "#94a3b8", marginTop: "8px", marginBottom: 0, fontSize: "15px" },
  card: { backgroundColor: "#0a0a18", border: "1px solid #1a1a2e", borderRadius: "16px", padding: "20px" },
  sectionTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "24px", margin: "0 0 14px" },
  mutedText: { color: "#64748b", marginTop: 0 },
  companyGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" },
  companyCard: { background: "#0e1022", border: "1px solid #1f2340", borderRadius: "12px", textAlign: "left", padding: "14px", color: "#e2e2f0", cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" },
  companyName: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "19px", marginBottom: "8px" },
  companyDesc: { color: "#94a3b8", fontSize: "13px", lineHeight: 1.5 },
  selectorGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "18px", marginTop: "10px" },
  selectorHeading: { margin: "0 0 10px", color: "#cbd5e1", fontWeight: 700 },
  optionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" },
  optionCard: { background: "#0d1021", border: "1px solid #1a1a2e", borderRadius: "10px", padding: "12px", color: "#e2e2f0", textAlign: "left", cursor: "pointer" },
  optionCardActive: { border: "1px solid #8b5cf6", background: "#7c3aed1f" },
  optionTitle: { fontWeight: 700 },
  optionDesc: { color: "#94a3b8", fontSize: "12px", marginTop: "4px" },
  actionRow: { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px", flexWrap: "wrap" },
  primaryBtn: { background: "linear-gradient(120deg, #6366f1, #a78bfa)", color: "#ffffff", border: "none", borderRadius: "10px", padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: "14px" },
  secondaryBtn: { background: "#12152b", color: "#e2e2f0", border: "1px solid #1f2340", borderRadius: "10px", padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: "14px" },
  disabledBtn: { opacity: 0.5, cursor: "not-allowed" },
  spinnerWrap: { display: "flex", gap: "8px", alignItems: "center", marginTop: "12px" },
  spinner: { width: "16px", height: "16px", borderRadius: "50%", border: "2px solid #29304f", borderTop: "2px solid #a78bfa", animation: "ciSpin 0.8s linear infinite" },
  errorBox: { background: "#450a0a", border: "1px solid #7f1d1d", color: "#fecaca", borderRadius: "10px", padding: "10px 12px", marginBottom: "12px" },
  topMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" },
  metaLabel: { margin: 0, color: "#94a3b8", fontSize: "13px" },
  metaQuestionCount: { margin: "4px 0 0", fontFamily: "'Syne', sans-serif", fontWeight: 500 },
  badgeRow: { display: "flex", gap: "8px" },
  difficultyBadge: { border: "1px solid #ffffff22", borderRadius: "999px", padding: "4px 10px", fontFamily: "'Syne', sans-serif", fontSize: "12px", fontWeight: 700 },
  progressDotsRow: { display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" },
  progressDot: { width: "16px", height: "10px", borderRadius: "999px", background: "#1a1a2e", border: "1px solid #2a2e4e" },
  progressDotDone: { background: "#7c3aed", border: "1px solid #8b5cf6" },
  progressDotCurrent: { width: "30px", background: "#6366f1", border: "1px solid #818cf8", animation: "ciPulse 1.1s ease-in-out infinite" },
  timerSkillRow: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", flexWrap: "wrap" },
  timerWrap: { width: "84px", height: "84px", position: "relative", flexShrink: 0 },
  timerCenter: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 500, color: "#e2e2f0" },
  skillLabel: { margin: "0 0 6px", color: "#cbd5e1", fontWeight: 600 },
  skillTrack: { height: "10px", background: "#1a1a2e", borderRadius: "999px", overflow: "hidden" },
  skillFill: { height: "100%", borderRadius: "999px", background: "linear-gradient(120deg, #6366f1, #a78bfa)", transition: "width 0.8s ease" },
  questionCard: { background: "#0f1328", border: "1px solid #20274a", borderRadius: "12px", padding: "14px", marginBottom: "12px" },
  questionText: { fontSize: "17px", lineHeight: 1.6, margin: 0, color: "#e2e2f0" },
  answerWrap: { background: "#090d1f", border: "1px solid #20274a", borderRadius: "12px", overflow: "hidden", marginBottom: "12px" },
  answerInput: { width: "100%", background: "transparent", color: "#e2e2f0", border: "none", outline: "none", resize: "vertical", padding: "12px", fontFamily: "'Syne', sans-serif", fontSize: "14px", lineHeight: 1.6, minHeight: "140px", boxSizing: "border-box" },
  charCount: { borderTop: "1px solid #20274a", padding: "8px 12px", color: "#64748b", fontFamily: "'Syne', sans-serif", fontSize: "12px", textAlign: "right" },
  feedbackTop: { display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" },
  scoreRingWrap: { position: "relative", width: "120px", height: "120px", flexShrink: 0 },
  scoreRingCenter: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "30px" },
  feedbackTextBox: { flex: 1, minWidth: "240px", background: "#0f1328", border: "1px solid #20274a", borderRadius: "12px", padding: "12px" },
  metricTitle: { margin: "0 0 6px", fontWeight: 700 },
  feedbackText: { margin: 0, color: "#cbd5e1", lineHeight: 1.6 },
  metricGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "10px", marginBottom: "16px" },
  metricRow: { background: "#0d1021", border: "1px solid #1a1a2e", borderRadius: "10px", padding: "10px" },
  metricHead: { display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "center" },
  metricName: { fontWeight: 600, color: "#cbd5e1", fontSize: "13px" },
  metricValue: { fontFamily: "'Syne', sans-serif", fontSize: "12px" },
  metricTrack: { height: "8px", background: "#1a1a2e", borderRadius: "999px", overflow: "hidden" },
  metricFill: { height: "100%", background: "linear-gradient(120deg, #6366f1, #a78bfa)" },
  summaryStatsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "12px" },
  statCard: { background: "#0d1021", border: "1px solid #1a1a2e", borderRadius: "10px", padding: "12px" },
  statLabel: { color: "#94a3b8", margin: 0, fontSize: "12px" },
  statValue: { margin: "8px 0 0", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "28px" },
  summaryList: { display: "grid", gap: "8px", marginTop: "10px", marginBottom: "16px" },
  summaryRow: { background: "#0d1021", border: "1px solid #1a1a2e", borderRadius: "10px", padding: "10px" },
  summaryRowHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  summaryQLabel: { fontFamily: "'Syne', sans-serif", fontSize: "12px", color: "#cbd5e1" },
  summaryQMeta: { fontFamily: "'Syne', sans-serif", fontSize: "12px", color: "#94a3b8" },
  summaryTrack: { height: "8px", borderRadius: "999px", background: "#1a1a2e", overflow: "hidden" },
  summaryFill: { height: "100%", borderRadius: "999px" },
};
