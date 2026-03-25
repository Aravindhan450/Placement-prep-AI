import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define EXACT request interface
interface RequestBody {
  topic: string;
}

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

    // Safe JSON parsing
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON body"
        }),
        { status: 400, headers }
      );
    }

    console.log("generate-insight body:", body);

    // STRICT validation
    if (!body.topic || typeof body.topic !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "topic is required"
        }),
        { status: 400, headers }
      );
    }

    // Sanitize topic
    const topic = body.topic.trim().toLowerCase();

    // Authenticate user
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error("JWT validation failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers }
      );
    }

    const user_id = user.id;

    // Query database for latest 2 attempts to calculate skill progression
    const { data: attempts, error: queryError } = await supabaseAdmin
      .from("attempt_history")
      .select("skill_index, difficulty, correctness, depth, confidence, clarity, created_at")
      .eq("user_id", user_id)
      .eq("topic", topic)
      .order("created_at", { ascending: false })
      .limit(2);

    if (queryError) {
      console.error("Query error:", queryError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch attempt history" }),
        { status: 500, headers }
      );
    }

    if (!attempts || attempts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No attempt history found for this topic" 
        }),
        { status: 404, headers }
      );
    }

    // Get current and previous skill from database
    const current_skill = attempts[0].skill_index;
    const previous_skill = attempts.length > 1 ? attempts[1].skill_index : 0.5; // Default to 0.5 if first attempt
    const difficulty = attempts[0].difficulty as "easy" | "medium" | "hard";
    
    const evaluation = {
      correctness: attempts[0].correctness,
      concept_depth: attempts[0].depth,
      confidence: attempts[0].confidence,
      clarity: attempts[0].clarity,
    };

    // Calculate skill delta
    const skill_delta = current_skill - previous_skill;

    // Generate insight based on skill_delta
    let baseInsight = "";
    
    if (skill_delta > 0.1) {
      baseInsight = "Your performance improved significantly, so question difficulty increased.";
    } else if (skill_delta >= 0.02 && skill_delta <= 0.1) {
      baseInsight = "Steady improvement detected. The system is gradually increasing challenge level.";
    } else if (skill_delta > -0.02 && skill_delta < 0.02) {
      baseInsight = "Skill level stable. Difficulty maintained to reinforce understanding.";
    } else {
      baseInsight = "Performance dropped slightly. Difficulty adjusted to rebuild fundamentals.";
    }

    // Analyze evaluation metrics to find strengths and weaknesses
    const metrics = [
      { name: "correctness", value: evaluation.correctness, label: "Correctness" },
      { name: "concept_depth", value: evaluation.concept_depth, label: "Concept Depth" },
      { name: "confidence", value: evaluation.confidence, label: "Confidence" },
      { name: "clarity", value: evaluation.clarity, label: "Clarity" },
    ];

    // Find highest and lowest metrics
    const sortedMetrics = [...metrics].sort((a, b) => b.value - a.value);
    const strongest = sortedMetrics[0];
    const weakest = sortedMetrics[sortedMetrics.length - 1];

    // Build metric-based explanation
    let metricInsight = "";
    
    if (strongest.value >= 0.8) {
      metricInsight = ` Your ${strongest.label.toLowerCase()} was excellent.`;
    } else if (strongest.value >= 0.6) {
      metricInsight = ` Your ${strongest.label.toLowerCase()} was solid.`;
    }

    if (weakest.value < 0.5) {
      metricInsight += ` Focus on improving ${weakest.label.toLowerCase()} in future responses.`;
    } else if (weakest.value < 0.7) {
      metricInsight += ` Consider strengthening your ${weakest.label.toLowerCase()}.`;
    }

    // Add difficulty context
    let difficultyContext = "";
    if (difficulty === "easy") {
      difficultyContext = " Currently at foundational level.";
    } else if (difficulty === "medium") {
      difficultyContext = " Currently at intermediate level.";
    } else if (difficulty === "hard") {
      difficultyContext = " Currently at advanced level.";
    }

    // Combine all insights
    const insight = baseInsight + metricInsight + difficultyContext;

    return new Response(
      JSON.stringify({
        success: true,
        insight
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error("Generate Insight Error:", error);
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
