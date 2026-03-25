import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  calculateDifficultyFactor,
  calculateImprovementTrend,
  calculateReadinessScore,
} from "../../shared/readiness.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function resolveTopic(params: URLSearchParams): string {
  const topic = params.get("topic");
  const company = params.get("company");
  const role = params.get("role");

  if (topic && topic.trim().length > 0) return topic.trim().toLowerCase();
  if (company && role) return `${company.trim().toLowerCase()}_${role.trim().toLowerCase()}`;
  return "general";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
        status: 405,
        headers,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Missing authorization header" }), {
        status: 401,
        headers,
      });
    }
    const accessToken = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers,
      });
    }

    const url = new URL(req.url);
    const company = url.searchParams.get("company");
    const role = url.searchParams.get("role");
    const topic = url.searchParams.get("topic");
    const learningTopic = resolveTopic(url.searchParams);

    let sessionsQuery = supabaseAdmin
      .from("interview_sessions")
      .select("id, avg_score, start_time")
      .eq("user_id", user.id)
      .order("start_time", { ascending: false })
      .limit(5);

    if (topic) {
      sessionsQuery = sessionsQuery.eq("topic", topic);
    } else {
      if (company) sessionsQuery = sessionsQuery.eq("company", company);
      if (role) sessionsQuery = sessionsQuery.eq("role", role);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;
    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    const orderedSessions = [...(sessions ?? [])].reverse();
    const lastSessionAvgScores = orderedSessions.map((s) => Number(s.avg_score ?? 0));
    const sessionIds = orderedSessions.map((s) => s.id).filter(Boolean);

    let difficulties: string[] = [];
    if (sessionIds.length > 0) {
      const { data: attempts, error: attemptsError } = await supabaseAdmin
        .from("attempt_history")
        .select("difficulty")
        .eq("user_id", user.id)
        .in("session_id", sessionIds);

      if (attemptsError) {
        throw new Error(`Failed to fetch attempts: ${attemptsError.message}`);
      }

      difficulties = (attempts ?? [])
        .map((attempt) => String(attempt.difficulty ?? "").trim().toLowerCase())
        .filter(Boolean);
    }

    const difficultyFactor = calculateDifficultyFactor(difficulties);
    const improvementTrend = calculateImprovementTrend(lastSessionAvgScores);
    const readinessScore = calculateReadinessScore({
      lastSessionAvgScores,
      difficultyWeighting: difficultyFactor,
      improvementTrend,
    });

    const { error: upsertError } = await supabaseAdmin
      .from("user_learning_state")
      .upsert(
        {
          user_id: user.id,
          topic: learningTopic,
          readiness_score: readinessScore,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id,topic" }
      );

    if (upsertError) {
      throw new Error(`Failed to persist readiness score: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        readiness_score: readinessScore,
        components: {
          average_score: lastSessionAvgScores.length > 0
            ? Number(
                (
                  lastSessionAvgScores.reduce((sum, score) => {
                    const normalized = score <= 1 ? score * 100 : score;
                    return sum + normalized;
                  }, 0) / lastSessionAvgScores.length
                ).toFixed(2)
              )
            : 0,
          improvement_trend: Number(improvementTrend.toFixed(2)),
          difficulty_factor: Number(difficultyFactor.toFixed(2)),
        },
        sessions_considered: lastSessionAvgScores.length,
        topic: learningTopic,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers }
    );
  }
});
