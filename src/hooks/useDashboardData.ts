import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

interface LearningStateRecord {
  topic: string;
  weak_concepts: string[] | null;
  strong_concepts: string[] | null;
  readiness_score: number | null;
  last_updated: string;
}

interface InterviewSessionRecord {
  start_time: string;
  avg_score: number | null;
  questions_attempted: number | null;
}

interface RadarDatum {
  topic: string;
  strength: number;
  weakness: number;
}

interface ReadinessTrendPoint {
  date: string;
  readiness: number;
}

interface Analytics {
  dashboardData: {
    sessionCount: number;
    attemptCount: number;
    weakConceptCount: number;
  };
  skill_progression: number[];
  questions_attempted: number;
  average_skill: number;
  difficulty_distribution: DifficultyDistribution;
  improvement_rate: number;
  radar_data: RadarDatum[];
  readiness_trend: ReadinessTrendPoint[];
  weak_concepts: string[];
  weak_recommendation: string;
  readiness_score: number | null;
}

interface UseDashboardDataReturn {
  loading: boolean;
  analytics: Analytics;
  refreshDashboardCounts: () => Promise<void>;
  loadDashboardData: () => Promise<void>;
}

const initialAnalytics: Analytics = {
  dashboardData: {
    sessionCount: 0,
    attemptCount: 0,
    weakConceptCount: 0,
  },
  skill_progression: [],
  questions_attempted: 0,
  average_skill: 0,
  difficulty_distribution: {
    easy: 0,
    medium: 0,
    hard: 0,
  },
  improvement_rate: 0,
  radar_data: [],
  readiness_trend: [],
  weak_concepts: [],
  weak_recommendation: "Keep practicing to reveal weak concepts.",
  readiness_score: null,
};

function toPercent(score: number): number {
  if (!Number.isFinite(score)) return 0;
  const percent = score <= 1 ? score * 100 : score;
  return Math.max(0, Math.min(100, percent));
}

function normalizeConcepts(input: string[] | null): string[] {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

export function useDashboardData(): UseDashboardDataReturn {
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<Analytics>(initialAnalytics);

  const refreshDashboardCounts = useCallback(async (): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const [
      { count: sessionCount, error: sessionCountError },
      { count: attemptCount, error: attemptCountError },
      { data: latestLearningState, error: latestLearningStateError },
    ] = await Promise.all([
      supabase
        .from("interview_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("attempt_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("user_learning_state")
        .select("weak_concepts")
        .eq("user_id", user.id)
        .order("last_updated", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (sessionCountError) throw new Error(sessionCountError.message);
    if (attemptCountError) throw new Error(attemptCountError.message);
    if (latestLearningStateError) throw new Error(latestLearningStateError.message);

    const weakConceptCount = latestLearningState?.weak_concepts?.length ?? 0;

    setAnalytics((prev) => ({
      ...prev,
      dashboardData: {
        sessionCount: sessionCount ?? 0,
        attemptCount: attemptCount ?? 0,
        weakConceptCount,
      },
      questions_attempted: attemptCount ?? prev.questions_attempted,
    }));
  }, []);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAnalytics(initialAnalytics);
        return;
      }

      const [learningRes, sessionsRes] = await Promise.all([
        supabase
          .from("user_learning_state")
          .select("topic, weak_concepts, strong_concepts, readiness_score, last_updated")
          .eq("user_id", user.id)
          .order("last_updated", { ascending: true }),
        supabase
          .from("interview_sessions")
          .select("start_time, avg_score, questions_attempted")
          .eq("user_id", user.id)
          .order("start_time", { ascending: true }),
      ]);

      if (learningRes.error) throw new Error(learningRes.error.message);
      if (sessionsRes.error) throw new Error(sessionsRes.error.message);

      const learningState = (learningRes.data ?? []) as LearningStateRecord[];
      const sessions = (sessionsRes.data ?? []) as InterviewSessionRecord[];

      const radar_data: RadarDatum[] = learningState.map((row) => ({
        topic: row.topic,
        strength: normalizeConcepts(row.strong_concepts).length,
        weakness: normalizeConcepts(row.weak_concepts).length,
      }));

      const weakConceptCounts = new Map<string, number>();
      for (const row of learningState) {
        for (const concept of normalizeConcepts(row.weak_concepts)) {
          weakConceptCounts.set(concept, (weakConceptCounts.get(concept) ?? 0) + 1);
        }
      }

      const weak_concepts = [...weakConceptCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([concept]) => concept);
      const topWeakConcept = weak_concepts[0];
      const weak_recommendation = topWeakConcept
        ? `You should revise ${topWeakConcept}.`
        : "You currently have no weak concepts flagged. Keep practicing.";

      const readiness_trend: ReadinessTrendPoint[] = learningState
        .filter((row) => row.readiness_score != null)
        .map((row) => {
          const timestamp = new Date(row.last_updated);
          return {
            date: timestamp.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            readiness: Number(toPercent(Number(row.readiness_score)).toFixed(2)),
          };
        });

      const skill_progression = readiness_trend.map((point) => point.readiness / 100);
      const questions_attempted = sessions.reduce(
        (sum, session) => sum + Number(session.questions_attempted ?? 0),
        0
      );
      const average_skill = skill_progression.length > 0
        ? skill_progression.reduce((sum, score) => sum + score, 0) / skill_progression.length
        : 0;
      const improvement_rate = skill_progression.length > 1
        ? (skill_progression[skill_progression.length - 1] - skill_progression[0]) / skill_progression.length
        : 0;

      const lastLearningState = learningState.length > 0 ? learningState[learningState.length - 1] : null;
      const readiness_score = lastLearningState?.readiness_score == null
        ? null
        : Number(toPercent(Number(lastLearningState.readiness_score)).toFixed(2));

      setAnalytics({
        dashboardData: {
          sessionCount: sessions.length,
          attemptCount: questions_attempted,
          weakConceptCount: weak_concepts.length,
        },
        skill_progression,
        questions_attempted,
        average_skill,
        difficulty_distribution: {
          easy: 0,
          medium: 0,
          hard: 0,
        },
        improvement_rate,
        radar_data,
        readiness_trend,
        weak_concepts,
        weak_recommendation,
        readiness_score,
      });

      await refreshDashboardCounts();
    } catch (error) {
      console.error("Error loading dashboard analytics:", error);
      setAnalytics(initialAnalytics);
    } finally {
      setLoading(false);
    }
  }, [refreshDashboardCounts]);

  useEffect(() => {
    let mounted = true;

    async function initialLoad() {
      if (!mounted) return;
      await loadDashboard();
    }

    void initialLoad();

    return () => {
      mounted = false;
    };
  }, [loadDashboard]);

  return { loading, analytics, refreshDashboardCounts, loadDashboardData: loadDashboard };
}
