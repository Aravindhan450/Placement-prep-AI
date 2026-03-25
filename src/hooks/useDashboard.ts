/*
Create a React custom hook named useDashboard.

Goal:
Load and manage dashboard analytics data.

Use functions from "../services/dashboardApi".

State:
- skills (array)
- history (array)
- recentAttempts (array)
- loading (boolean)

Behavior:
- load all data on mount
- fetch skill_state first
- automatically load history for weakest topic
  (lowest skill_score)

Compute derived values:

1. interviewReadinessScore:
   average of all skill_score values * 100

2. weakestTopic:
   topic with lowest skill_score

Return:
{
 skills,
 history,
 recentAttempts,
 interviewReadinessScore,
 weakestTopic,
 loading
}

Use useEffect and async loading pattern.

Generate full TypeScript hook.
*/

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  getSkillState,
  getSkillHistory,
  getRecentAttempts,
  type SkillState,
  type AttemptHistory,
} from '../services/dashboardApi';

interface UseDashboardReturn {
  skills: SkillState[];
  history: AttemptHistory[];
  recentAttempts: AttemptHistory[];
  interviewReadinessScore: number;
  focusTopic: string | null;
  nextStep: {
    topic: string;
    avgSkill: number;
    attempts: number;
  } | null;
  skillDimensions: {
    problem_solving: number;
    concept_depth: number;
    communication: number;
    confidence: number;
    consistency: number;
  } | null;
  readinessPrediction: {
    predictedReadiness: number;
    sessionsToReady: number;
  } | null;
  dailyMission: {
    topic: string;
    targetQuestions: number;
    completed: number;
    status: string;
  } | null;
  momentum: {
    streakDays: number;
  } | null;
  loading: boolean;
  error: string | null;
}

export function useDashboard(): UseDashboardReturn {
  const [skills, setSkills] = useState<SkillState[]>([]);
  const [history, setHistory] = useState<AttemptHistory[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<AttemptHistory[]>([]);
  const [focusTopic, setFocusTopic] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<{
    topic: string;
    avgSkill: number;
    attempts: number;
  } | null>(null);
  const [skillDimensions, setSkillDimensions] = useState<{
    problem_solving: number;
    concept_depth: number;
    communication: number;
    confidence: number;
    consistency: number;
  } | null>(null);
  const [readinessPrediction, setReadinessPrediction] = useState<{
    predictedReadiness: number;
    sessionsToReady: number;
  } | null>(null);
  const [dailyMission, setDailyMission] = useState<{
    topic: string;
    targetQuestions: number;
    completed: number;
    status: string;
  } | null>(null);
  const [momentum, setMomentum] = useState<{ streakDays: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Compute interview readiness score
  const interviewReadinessScore = skills.length > 0
    ? (skills.reduce((sum, skill) => sum + skill.skill_score, 0) / skills.length) * 100
    : 0;

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Fetch skill state first
        const skillData = await getSkillState();

        if (!mounted) return;

        setSkills(skillData);

        // Step 2: Load history for weakest topic if skills exist
        if (skillData.length > 0) {
          const weakest = skillData.reduce((weakest, current) =>
            current.skill_score < weakest.skill_score ? current : weakest
          );

          const historyData = await getSkillHistory(weakest.topic);

          if (!mounted) return;

          setHistory(historyData);
        }

        // Step 3: Fetch recent attempts
        const recentData = await getRecentAttempts();

        if (!mounted) return;

        setRecentAttempts(recentData);

        // Step 4: Fetch focus recommendation from RPC
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (user) {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token ?? null;

          if (accessToken) {
            const { error: createMissionError } = await supabase.functions.invoke("create-daily-mission", {
              headers: { Authorization: `Bearer ${accessToken}` },
              body: { user_id: user.id },
            });
            if (createMissionError) {
              console.error("Failed to create daily mission:", createMissionError);
            }
          }

          const today = new Date().toISOString().slice(0, 10);
          const tomorrowDate = new Date(`${today}T00:00:00.000Z`);
          tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
          const tomorrow = tomorrowDate.toISOString().slice(0, 10);

          const { data: missionData, error: missionError } = await supabase
            .from("daily_missions")
            .select("topic, target_questions, completed, status")
            .eq("user_id", user.id)
            .eq("mission_date", today)
            .maybeSingle();

          if (missionError) {
            console.error("Failed to fetch daily mission:", missionError);
            if (mounted) setDailyMission(null);
          } else if (missionData?.topic) {
            const targetQuestions = Number(missionData.target_questions ?? 3);
            const { count: completedCount, error: completedCountError } = await supabase
              .from("attempt_history")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("topic", missionData.topic)
              .gte("created_at", `${today}T00:00:00.000Z`)
              .lt("created_at", `${tomorrow}T00:00:00.000Z`);

            if (completedCountError) {
              console.error("Failed to compute mission progress:", completedCountError);
            }

            const completed = Math.max(0, Math.min(targetQuestions, Number(completedCount ?? 0)));
            const status = completed >= targetQuestions ? "completed" : "active";

            if (
              completed !== Number(missionData.completed ?? 0) ||
              status !== String(missionData.status ?? "active")
            ) {
              const { error: missionUpdateError } = await supabase
                .from("daily_missions")
                .update({ completed, status })
                .eq("user_id", user.id)
                .eq("mission_date", today);
              if (missionUpdateError) {
                console.error("Failed to update mission progress:", missionUpdateError);
              }
            }

            if (mounted) {
              setDailyMission({
                topic: missionData.topic,
                targetQuestions,
                completed,
                status,
              });
            }
          } else if (mounted) {
            setDailyMission(null);
          }

          const { data: dimensionsData, error: dimensionsError } = await supabase
            .from("user_skill_dimensions")
            .select("problem_solving, concept_depth, communication, confidence, consistency")
            .eq("user_id", user.id)
            .maybeSingle();

          if (dimensionsError) {
            console.error("Failed to fetch user skill dimensions:", dimensionsError);
            if (mounted) setSkillDimensions(null);
          } else if (mounted && dimensionsData) {
            setSkillDimensions({
              problem_solving: Number(dimensionsData.problem_solving ?? 0),
              concept_depth: Number(dimensionsData.concept_depth ?? 0),
              communication: Number(dimensionsData.communication ?? 0),
              confidence: Number(dimensionsData.confidence ?? 0),
              consistency: Number(dimensionsData.consistency ?? 0),
            });
          } else if (mounted) {
            setSkillDimensions(null);
          }

          const { data: momentumData, error: momentumError } = await supabase
            .from("user_momentum")
            .select("streak_days")
            .eq("user_id", user.id)
            .maybeSingle();

          if (momentumError) {
            console.error("Failed to fetch user momentum:", momentumError);
            if (mounted) setMomentum(null);
          } else if (mounted) {
            setMomentum({
              streakDays: Number(momentumData?.streak_days ?? 0),
            });
          }

          const { data: focusData, error: focusError } = await supabase.rpc(
            "get_focus_recommendation",
            { p_user: user.id }
          );

          if (focusError) {
            console.error("Failed to fetch focus recommendation:", focusError);
            if (mounted) setFocusTopic(null);
          } else if (mounted) {
            const recommendedTopic =
              Array.isArray(focusData) && focusData.length > 0
                ? String((focusData[0] as { topic?: string }).topic ?? "").trim()
                : "";
            setFocusTopic(recommendedTopic.length > 0 ? recommendedTopic : null);
          }

          const { data: nextStepData, error: nextStepError } = await supabase.rpc(
            "get_next_step_recommendation",
            { p_user: user.id }
          );

          if (nextStepError) {
            console.error("Failed to fetch next step recommendation:", nextStepError);
            if (mounted) setNextStep(null);
          } else if (mounted) {
            const row =
              Array.isArray(nextStepData) && nextStepData.length > 0
                ? (nextStepData[0] as { topic?: string; avg_skill?: number; attempts?: number })
                : null;

            if (row?.topic) {
              setNextStep({
                topic: String(row.topic),
                avgSkill: Number(row.avg_skill ?? 0),
                attempts: Number(row.attempts ?? 0),
              });
            } else {
              setNextStep(null);
            }
          }

          const { data: predictionData, error: predictionError } = await supabase.rpc(
            "predict_readiness",
            { p_user: user.id }
          );

          if (predictionError) {
            console.error("Failed to fetch readiness prediction:", predictionError);
            if (mounted) setReadinessPrediction(null);
          } else if (mounted) {
            const row =
              Array.isArray(predictionData) && predictionData.length > 0
                ? (predictionData[0] as { predicted_readiness?: number; sessions_to_ready?: number })
                : null;

            if (row) {
              setReadinessPrediction({
                predictedReadiness: Number(row.predicted_readiness ?? 0),
                sessionsToReady: Number(row.sessions_to_ready ?? 0),
              });
            } else {
              setReadinessPrediction(null);
            }
          }
        }
      } catch (err) {
        if (!mounted) return;

        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
        console.error('Error loading dashboard data:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    skills,
    history,
    recentAttempts,
    interviewReadinessScore,
    focusTopic,
    nextStep,
    skillDimensions,
    readinessPrediction,
    dailyMission,
    momentum,
    loading,
    error,
  };
}
