import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DIFFICULTY_WEIGHT: Record<string, number> = {
  easy: 0.05,
  medium: 0.1,
  hard: 0.15,
};

// Define STRICT request body interface
interface RequestBody {
  topic: string;
  session_id?: string;
  evaluation: {
    correctness: number;
    concept_depth: number;
    confidence: number;
    clarity: number;
  };
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Helper to clamp values to safe range
const clamp = (v: number) => Math.max(0, Math.min(1, v));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers }
      );
    }

    // Extract accessToken from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers }
      );
    }
    const accessToken = authHeader.replace("Bearer ", "");

    // Safely parse request body
    const body: RequestBody = await req.json();
    
    // Debug logging
    console.log("Incoming update-skill body:", body);

    // Validate payload structure
    if (
      !body ||
      typeof body.topic !== "string" ||
      !body.evaluation
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request format"
        }),
        { status: 400, headers }
      );
    }

    const {
      correctness,
      concept_depth,
      confidence,
      clarity
    } = body.evaluation;

    // Validate evaluation values are valid numbers
    if (
      [correctness, concept_depth, confidence, clarity]
        .some(v => typeof v !== "number" || isNaN(v))
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Evaluation values must be valid numbers"
        }),
        { status: 400, headers }
      );
    }

    // Clamp values to safe range (0-1)
    const evaluation = {
      correctness: clamp(correctness),
      concept_depth: clamp(concept_depth),
      confidence: clamp(confidence),
      clarity: clamp(clarity)
    };

    // Use provided difficulty or default to "medium"
    const difficulty = body.difficulty ?? "medium";
    const session_id = typeof body.session_id === "string" ? body.session_id : null;

    // ✅ Use service role client + getUser(token) directly
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      console.error("JWT validation failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers }
      );
    }

    // Extract user_id from validated JWT
    const user_id = user.id;
    const topic = body.topic;

    // Get current skill
    const { data: existing } = await supabaseAdmin
      .from("skill_state")
      .select("skill_score, attempts")
      .eq("user_id", user_id)
      .eq("topic", topic)
      .maybeSingle();

    const currentSkill = existing?.skill_score ?? 0.5;
    const attempts = (existing?.attempts ?? 0) + 1;

    // Calculate performance score from evaluation
    const performance = (
      evaluation.correctness +
      evaluation.concept_depth +
      evaluation.confidence +
      evaluation.clarity
    ) / 4;

    const weight = DIFFICULTY_WEIGHT[difficulty] ?? 0.1;
    const delta = (performance - currentSkill) * weight;
    const updatedSkill = Math.max(0, Math.min(1, currentSkill + delta));

    // Upsert skill state
    const { error: upsertError } = await supabaseAdmin
      .from("skill_state")
      .upsert({
        user_id,
        topic,
        skill_score: updatedSkill,
        attempts,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,topic" });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      throw new Error("Failed to update skill state");
    }

    // ✅ INSERT INTO attempt_history (stores each question attempt)
    const { error: historyError } = await supabaseAdmin
      .from("attempt_history")
      .insert({
        user_id,
        session_id,
        topic,
        difficulty,
        skill_index: updatedSkill,
        correctness: evaluation.correctness,
        depth: evaluation.concept_depth,
        confidence: evaluation.confidence,
        clarity: evaluation.clarity,
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error("Failed to insert attempt_history:", historyError);
      // Don't throw - skill update succeeded, history is secondary
    } else {
      console.log("✅ Attempt recorded in attempt_history table");
    }

    // Return consistent success response
    return new Response(
      JSON.stringify({
        success: true,
        updated: true
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error("Update Skill Error:", error);
    const headers = { ...corsHeaders, "Content-Type": "application/json" };
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers }
    );
  }
});
