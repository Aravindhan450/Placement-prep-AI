import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getLearningState } from "../../shared/learning-state.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// How old a cached question can be before we refresh (7 days)
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getDifficulty(skill: number): string {
  if (skill < 0.4) return "easy";
  if (skill <= 0.7) return "medium";
  return "hard";
}

async function searchRecentQuestions(company: string, role: string, roundType: string): Promise<string> {
  const query = `${company} ${role} ${roundType} interview questions 2024 2025`;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a research assistant with knowledge of tech company interview processes up to early 2025.
Your job is to recall and summarize the most frequently asked ${roundType} interview questions at ${company} for ${role} roles.
Base this on patterns from Glassdoor, LeetCode discuss, GeeksForGeeks, and interview blogs.
Return 5-8 specific question patterns or themes that are commonly reported. Be concrete and specific.
Format: numbered list only. No explanations.`,
        },
        {
          role: "user",
          content: `What are the most frequently asked ${roundType} interview questions at ${company} for ${role} positions in 2024-2025?`,
        },
      ],
      max_tokens: 600,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq recent-pattern lookup failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? query;
}

async function generateAdaptiveQuestion(
  company: string,
  role: string,
  roundType: string,
  difficulty: string,
  interviewStyle: string,
  focusAreas: string[],
  weakConcepts: string[],
  recentPatterns: string,
  previousQuestions: string[]
): Promise<string> {
  const prevList =
    previousQuestions.length > 0
      ? `\nAvoid repeating these already-asked questions:\n${previousQuestions
          .slice(-5)
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}`
      : "";

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert ${company} interviewer conducting a ${roundType} interview for a ${role} position.

Company interview style: ${interviewStyle}
Focus areas: ${focusAreas.join(", ")}
Candidate weak concepts to reinforce: ${weakConcepts.length > 0 ? weakConcepts.join(", ") : "none"}

Recent question patterns reported by candidates:
${recentPatterns}

Generate ONE realistic ${difficulty} difficulty interview question that:
- Matches ${company}'s actual interview style
- Is appropriate for a ${roundType} round
- Is specific and detailed (not vague)
- Feels like it came from a real ${company} interviewer
${prevList}

Rules:
- ONE question only
- No answer, no hints, no explanation
- No markdown
- Plain text only
- Make it sound authentic to ${company}'s culture`,
        },
        {
          role: "user",
          content: `Generate a ${difficulty} ${roundType} interview question for ${company} ${role}.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq question generation failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { company, role, roundType, accessToken, previousQuestions = [] } = body;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing access token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!company || !role || !roundType) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing company, role, or roundType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company profile
    const { data: profile } = await supabaseAdmin
      .from("company_profiles")
      .select("*")
      .eq("company", company)
      .eq("role", role)
      .maybeSingle();

    const interviewStyle = profile?.interview_style ?? `${company} standard interview process`;
    const focusAreas: string[] = profile?.focus_areas ?? [];

    // Get skill score for adaptive difficulty
    const { data: skillData } = await supabaseAdmin
      .from("skill_state")
      .select("skill_score")
      .eq("user_id", user.id)
      .eq("company", company)
      .eq("role", role)
      .maybeSingle();

    const skillScore = skillData?.skill_score ?? 0.5;
    const difficulty = getDifficulty(skillScore);
    let weakConcepts: string[] = [];

    try {
      const learningState = await getLearningState(user.id, `${company.toLowerCase()}_${role.toLowerCase()}`);
      weakConcepts = learningState.weak_concepts;
    } catch (learningError) {
      console.error("Failed to load learning state:", learningError);
    }

    // Check cache for recent questions (fresher than 7 days)
    const { data: cachedQuestions } = await supabaseAdmin
      .from("company_questions")
      .select("question, last_refreshed")
      .eq("company", company)
      .eq("role", role)
      .eq("round_type", roundType)
      .eq("difficulty", difficulty)
      .gt("last_refreshed", new Date(Date.now() - CACHE_TTL_MS).toISOString())
      .order("times_used", { ascending: true })
      .limit(10);

    let recentPatterns = "";

    // If cache is stale or empty, search for fresh patterns
    if (!cachedQuestions || cachedQuestions.length < 3) {
      console.log("Cache stale or empty - fetching fresh patterns from Groq knowledge");
      recentPatterns = await searchRecentQuestions(company, role, roundType);
    } else {
      recentPatterns = cachedQuestions.map((q) => q.question).join("\n");
    }

    // Generate adaptive question
    const question = await generateAdaptiveQuestion(
      company,
      role,
      roundType,
      difficulty,
      interviewStyle,
      focusAreas,
      weakConcepts,
      recentPatterns,
      previousQuestions
    );

    if (!question) throw new Error("Failed to generate question");

    // Save to cache
    const { data: saved } = await supabaseAdmin
      .from("company_questions")
      .insert({
        company,
        role,
        round_type: roundType,
        question,
        difficulty,
        times_used: 1,
        last_refreshed: new Date().toISOString(),
      })
      .select("id")
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        question,
        difficulty,
        weak_concepts: weakConcepts,
        skill_score: skillScore,
        company,
        role,
        round_type: roundType,
        question_id: saved?.id,
        generated_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate Company Question Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
