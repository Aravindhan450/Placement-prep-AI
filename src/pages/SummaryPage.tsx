import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SessionSummary from "../components/interview/SessionSummary";
import {
  calculateAverageScore,
  clearActiveSessionAnalytics,
  endInterviewSession,
  getActiveSessionAnalytics,
} from "../services/interviewSessionApi";

export default function SummaryPage() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.removeItem("activeInterviewSession");

    const analytics = getActiveSessionAnalytics();
    if (!analytics) return;
    setSessionId(analytics.session_id);

    const avg = calculateAverageScore(analytics.scores);
    void endInterviewSession(analytics.session_id, avg, analytics.scores.length)
      .catch((e) => console.error("Failed to finalize interview session:", e))
      .finally(() => {
        clearActiveSessionAnalytics();
      });
  }, []);

  return (
    <SessionSummary
      sessionId={sessionId}
      onContinue={() => navigate("/")}
      onFinish={() => navigate("/dashboard")}
    />
  );
}
