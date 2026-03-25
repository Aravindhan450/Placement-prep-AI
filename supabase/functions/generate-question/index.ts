import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getLearningState } from "../../shared/learning-state.ts";
import { COMPANY_STYLE } from "../../shared/company-style.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Difficulty = "easy" | "medium" | "hard";

function getDifficulty(skill: number): Difficulty {
  if (skill < 0.4) return "easy";
  if (skill <= 0.7) return "medium";
  return "hard";
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract accessToken from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const accessToken = authHeader.replace("Bearer ", "");

    const body = await req.json();
    const {
      topic,
      weakConcepts: inputWeakConcepts = [],
      previousMistakes = [],
      previousMistake = "",
      previousQuestions = [],
      reinforce = false,
      company = null,
      role = null,
      difficulty: requestedDifficulty = null,
    } = body;

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid topic" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ Use service role client + getUser(token) directly
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken)

    if (authError || !user) {
      console.error("JWT validation failed:", authError)
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id)

    const { data: skillData, error: dbError } = await supabaseAdmin
      .from("skill_state")
      .select("skill_score")
      .eq("user_id", user.id)
      .eq("topic", topic)
      .maybeSingle();

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Database error");
    }

    const skillScore = clamp(skillData?.skill_score ?? 0.5);
    const adaptiveDifficulty = getDifficulty(skillScore);
    const difficulty: Difficulty =
      requestedDifficulty === "easy" || requestedDifficulty === "medium" || requestedDifficulty === "hard"
        ? requestedDifficulty
        : adaptiveDifficulty;
    let weakConcepts: string[] = [];

    try {
      const learningState = await getLearningState(user.id, topic.toLowerCase());
      const suppliedWeakConcepts = Array.isArray(inputWeakConcepts)
        ? inputWeakConcepts.map((c: unknown) => String(c).trim().toLowerCase()).filter(Boolean)
        : [];
      weakConcepts = [...new Set([...suppliedWeakConcepts, ...learningState.weak_concepts])];
    } catch (learningError) {
      console.error("Failed to load learning state:", learningError);
      weakConcepts = Array.isArray(inputWeakConcepts)
        ? [...new Set(inputWeakConcepts.map((c: unknown) => String(c).trim().toLowerCase()).filter(Boolean))]
        : [];
    }

    const safePreviousMistakes = Array.isArray(previousMistakes)
      ? previousMistakes.map((m: unknown) => String(m).trim()).filter(Boolean)
      : [];
    const safePreviousMistake =
      typeof previousMistake === "string" ? previousMistake.trim() : "";
    const safePreviousQuestions = Array.isArray(previousQuestions)
      ? previousQuestions.map((q: unknown) => String(q).trim()).filter(Boolean)
      : [];
    const { data: growthMemory } = await supabaseAdmin
      .from("user_growth_memory")
      .select("recurring_weakness, recent_improvement, last_session_summary")
      .eq("user_id", user.id)
      .maybeSingle();
    const memoryWeakness = Array.isArray(growthMemory?.recurring_weakness) && growthMemory.recurring_weakness.length > 0
      ? String(growthMemory.recurring_weakness[growthMemory.recurring_weakness.length - 1])
      : null;
    const growthMemoryContext = memoryWeakness
      ? `\nUser previously struggled with: ${memoryWeakness}. Generate question reinforcing improvement.`
      : "";
    const growthSummaryContext = growthMemory?.last_session_summary
      ? `\nGrowth memory summary: ${growthMemory.last_session_summary}`
      : "";

    const targetedConcept = weakConcepts.length > 0 ? weakConcepts[0] : null;
    const companyStyle = company ? COMPANY_STYLE[String(company).toLowerCase()] : undefined;
    const companyContext = company && role ? `\n- Company: ${company}\n- Role: ${role}` : "";
    const companyStyleContext = companyStyle
      ? `\n- Company interviewer focus: ${companyStyle.focus}
- Company evaluation bias: ${companyStyle.evaluationBias}
- Company follow-up style: ${companyStyle.followupStyle}`
      : "";
    const antiRepetitionContext =
      safePreviousQuestions.length > 0
        ? `\nAvoid repeating similar patterns to these prior questions:\n${safePreviousQuestions
            .slice(-5)
            .map((q: string, i: number) => `${i + 1}. ${q}`)
            .join("\n")}`
        : "";
    const previousMistakesContext =
      safePreviousMistakes.length > 0
        ? `\nCandidate previously made mistakes in: ${safePreviousMistakes.slice(-5).join(", ")}.`
        : "";
    const reinforceContext = reinforce
      ? `\nReinforcement mode is ON.
- Generate a question targeting the same concept the user previously struggled with, slightly simpler.
- Base reinforcement on this latest feedback/mistake: ${safePreviousMistake || "Not provided"}.
- Keep the scope focused and approachable while testing the same core concept.`
      : "";

    // Check if HR interview mode
    const isHR = topic === "hr";

    let systemMessage: string;
    let userMessage: string;

    if (isHR) {
      // HR/Behavioral Interview Mode
      systemMessage = `You are an HR interviewer conducting behavioral and situational interviews.${companyStyle ? `
Adopt company-specific behavior:
- Focus: ${companyStyle.focus}
- Evaluation bias: ${companyStyle.evaluationBias}
- Follow-up style: ${companyStyle.followupStyle}` : ""}`;
      userMessage = `Generate ONE placement interview question.

Context:
- Interview type: Behavioral / HR
- Candidate skill score: ${skillScore.toFixed(2)}
- Target difficulty: ${difficulty}
${companyContext}
${companyStyleContext}
${previousMistakesContext}
${reinforceContext}
${growthMemoryContext}
${growthSummaryContext}
Weak concepts to prioritize: ${weakConcepts.length > 0 ? weakConcepts.join(", ") : "none"}
${targetedConcept ? `Primary target concept for this question: ${targetedConcept}` : ""}

Generate an interview question that specifically targets concepts the user previously struggled with. Prioritize weakConcepts first. Avoid repeating similar question patterns.
${antiRepetitionContext}

Rules:
- If weakConcepts exists, the question MUST test one of them.
- If weakConcepts is empty, fallback to topic-based generation.
- If reinforcement mode is ON, target the same previously weak concept and make question slightly simpler.
- Ask situational or behavioral questions.
- Encourage storytelling.
- Real interview tone.
- No explanations.
- Plain text only.

Examples:
- Tell me about a time you handled conflict in a team.
- Describe a situation where you had to meet a tight deadline.
- How do you handle disagreement with a manager?

Generate ONE question now:`;
    } else {
      // Technical Interview Mode
      systemMessage = `You are a technical placement interviewer creating realistic interview questions.${companyStyle ? `
Adopt company-specific behavior:
- Focus: ${companyStyle.focus}
- Evaluation bias: ${companyStyle.evaluationBias}
- Follow-up style: ${companyStyle.followupStyle}` : ""}`;
      userMessage = `Generate ONE placement interview question.

Context:
- Topic: ${topic}
- Candidate skill score: ${skillScore.toFixed(2)}
- Target difficulty: ${difficulty}
${companyContext}
${companyStyleContext}
${previousMistakesContext}
${reinforceContext}
${growthMemoryContext}
${growthSummaryContext}
Weak concepts to prioritize: ${weakConcepts.length > 0 ? weakConcepts.join(", ") : "none"}
${targetedConcept ? `Primary target concept for this question: ${targetedConcept}` : ""}

Generate an interview question that specifically targets concepts the user previously struggled with. Prioritize weakConcepts first. Avoid repeating similar question patterns.
${antiRepetitionContext}

Rules:
- If weakConcepts exists, the question MUST test one of them.
- If weakConcepts is empty, fallback to topic-based generation.
- If reinforcement mode is ON, target the same previously weak concept and make question slightly simpler.
- Ask only ONE question.
- No explanation.
- No answer.
- No markdown.
- Plain text only.`;
    }

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!groqResponse.ok) {
      console.error("Groq error:", await groqResponse.text());
      throw new Error("Question generation failed");
    }

    const groqData = await groqResponse.json();
    let question = groqData.choices?.[0]?.message?.content?.trim() ?? "";

    if (!question) throw new Error("Invalid question output");

    question = question.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim();

    if (
      (question.startsWith('"') && question.endsWith('"')) ||
      (question.startsWith("'") && question.endsWith("'"))
    ) {
      question = question.slice(1, -1);
    }

    return new Response(
      JSON.stringify({
        success: true,
        topic,
        difficulty,
        skill_score: skillScore,
        weak_concepts: weakConcepts,
        targetedConcept,
        generated_at: new Date().toISOString(),
        question,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Generate Question Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
