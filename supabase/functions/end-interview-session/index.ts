import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    if (req.method !== "POST") {
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

    const body = await req.json();
    const { session_id, avg_score, questions_attempted } = body ?? {};

    if (!session_id || typeof session_id !== "string") {
      return new Response(JSON.stringify({ success: false, error: "session_id is required" }), {
        status: 400,
        headers,
      });
    }

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

    const { data: attempts, error: attemptsError } = await supabaseAdmin
      .from("attempt_history")
      .select("correctness, depth, confidence, clarity, created_at")
      .eq("session_id", session_id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (attemptsError) {
      throw new Error(`Failed to fetch session attempts: ${attemptsError.message}`);
    }

    const sessionReadiness =
      attempts && attempts.length > 0
        ? Number(
            (
              attempts.reduce((sum, attempt) => {
                const correctness = Number(attempt.correctness ?? 0);
                const depth = Number(attempt.depth ?? 0);
                const confidence = Number(attempt.confidence ?? 0);
                const clarity = Number(attempt.clarity ?? 0);
                return sum + (correctness + depth + confidence + clarity) / 4;
              }, 0) /
              attempts.length *
              100
            ).toFixed(2)
          )
        : 0;

    const { error } = await supabaseAdmin
      .from("interview_sessions")
      .update({
        end_time: new Date().toISOString(),
        avg_score: typeof avg_score === "number" ? avg_score : 0,
        questions_attempted: typeof questions_attempted === "number" ? questions_attempted : 0,
        readiness_score: sessionReadiness,
      })
      .eq("id", session_id)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    try {
      if (attempts && attempts.length > 0) {
        const avg = (values: number[]) =>
          values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
        const first = attempts[0];
        const last = attempts[attempts.length - 1];
        const metrics = {
          problem_solving: attempts.map((a) => Number(a.correctness ?? 0)),
          concept_depth: attempts.map((a) => Number(a.depth ?? 0)),
          confidence: attempts.map((a) => Number(a.confidence ?? 0)),
          communication: attempts.map((a) => Number(a.clarity ?? 0)),
        };
        const avgByMetric = Object.fromEntries(
          Object.entries(metrics).map(([key, values]) => [key, avg(values)])
        ) as Record<string, number>;
        const weakestConcept = Object.entries(avgByMetric).sort((a, b) => a[1] - b[1])[0]?.[0] ?? "concept_depth";

        const deltas = {
          problem_solving: Number(last.correctness ?? 0) - Number(first.correctness ?? 0),
          concept_depth: Number(last.depth ?? 0) - Number(first.depth ?? 0),
          confidence: Number(last.confidence ?? 0) - Number(first.confidence ?? 0),
          communication: Number(last.clarity ?? 0) - Number(first.clarity ?? 0),
        };
        const biggestImprovementEntry = Object.entries(deltas).sort((a, b) => b[1] - a[1])[0];
        const biggestImprovement = biggestImprovementEntry?.[1] > 0
          ? biggestImprovementEntry[0]
          : "consistency";

        const firstOverall =
          (Number(first.correctness ?? 0) +
            Number(first.depth ?? 0) +
            Number(first.confidence ?? 0) +
            Number(first.clarity ?? 0)) /
          4;
        const lastOverall =
          (Number(last.correctness ?? 0) +
            Number(last.depth ?? 0) +
            Number(last.confidence ?? 0) +
            Number(last.clarity ?? 0)) /
          4;
        const performanceDelta = Number((lastOverall - firstOverall).toFixed(3));
        const sessionSummary = `Weakest concept: ${weakestConcept}. Biggest improvement: ${biggestImprovement}. Avg performance delta: ${performanceDelta}.`;

        const { data: growthMemory } = await supabaseAdmin
          .from("user_growth_memory")
          .select("recurring_weakness, recent_improvement")
          .eq("user_id", user.id)
          .maybeSingle();

        const recurringWeakness = Array.from(
          new Set([...(growthMemory?.recurring_weakness ?? []), weakestConcept])
        );
        const recentImprovement = Array.from(
          new Set([...(growthMemory?.recent_improvement ?? []), biggestImprovement])
        );

        const { error: growthMemoryError } = await supabaseAdmin
          .from("user_growth_memory")
          .upsert(
            {
              user_id: user.id,
              recurring_weakness: recurringWeakness,
              recent_improvement: recentImprovement,
              last_session_summary: sessionSummary,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (growthMemoryError) {
          console.error("Failed to update user growth memory:", growthMemoryError);
        }
      }
    } catch (growthMemoryCatchError) {
      console.error("Failed to compute/store growth memory:", growthMemoryCatchError);
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: momentumState, error: momentumFetchError } = await supabaseAdmin
        .from("user_momentum")
        .select("streak_days, last_active_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (momentumFetchError) {
        console.error("Failed to fetch momentum:", momentumFetchError);
      } else {
        const prevStreak = Number(momentumState?.streak_days ?? 0);
        const lastActive = momentumState?.last_active_date
          ? new Date(`${momentumState.last_active_date}T00:00:00.000Z`)
          : null;
        const todayDate = new Date(`${today}T00:00:00.000Z`);
        const dayMs = 24 * 60 * 60 * 1000;
        const dayDiff = lastActive ? Math.floor((todayDate.getTime() - lastActive.getTime()) / dayMs) : null;

        let streakDays = prevStreak;
        if (dayDiff === null) {
          streakDays = 1;
        } else if (dayDiff === 0) {
          streakDays = Math.max(1, prevStreak);
        } else if (dayDiff === 1) {
          streakDays = Math.max(1, prevStreak + 1);
        } else {
          streakDays = 1;
        }

        const { error: momentumUpsertError } = await supabaseAdmin
          .from("user_momentum")
          .upsert(
            {
              user_id: user.id,
              streak_days: streakDays,
              last_active_date: today,
            },
            { onConflict: "user_id" }
          );

        if (momentumUpsertError) {
          console.error("Failed to update momentum:", momentumUpsertError);
        }
      }
    } catch (momentumCatchError) {
      console.error("Failed to compute momentum:", momentumCatchError);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
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
