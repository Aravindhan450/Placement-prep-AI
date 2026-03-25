import { supabase } from "../lib/supabase";

export interface SessionAnalyticsState {
  session_id: string;
  scores: number[];
}

const SESSION_STORAGE_KEY = "activeInterviewAnalyticsSession";

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No active session");
  return session.access_token;
}

export async function startInterviewSession(params: {
  company?: string | null;
  role?: string | null;
  topic: string;
}): Promise<string> {
  const accessToken = await getAccessToken();
  const { data, error } = await supabase.functions.invoke<{ success: boolean; session_id: string }>(
    "start-interview-session",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: params,
    }
  );
  if (error) throw new Error(error.message);
  if (!data?.success || !data.session_id) throw new Error("Failed to start interview session");
  return data.session_id;
}

export async function endInterviewSession(
  session_id: string,
  avg_score: number,
  questions_attempted: number
): Promise<void> {
  const accessToken = await getAccessToken();
  const { data, error } = await supabase.functions.invoke<{ success: boolean }>("end-interview-session", {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { session_id, avg_score, questions_attempted },
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error("Failed to end interview session");
}

export function saveActiveSessionAnalytics(state: SessionAnalyticsState): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
}

export function getActiveSessionAnalytics(): SessionAnalyticsState | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionAnalyticsState;
    if (!parsed.session_id || !Array.isArray(parsed.scores)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveSessionAnalytics(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function appendSessionScore(score: number): SessionAnalyticsState | null {
  const current = getActiveSessionAnalytics();
  if (!current) return null;
  const next = { ...current, scores: [...current.scores, score] };
  saveActiveSessionAnalytics(next);
  return next;
}

export function calculateAverageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

