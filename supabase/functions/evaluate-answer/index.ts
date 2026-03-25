import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { updateLearningState } from "../../shared/learning-state.ts";
import { COMPANY_STYLE } from "../../shared/company-style.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // ✅ Auth via header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const accessToken = authHeader.replace("Bearer ", "");

    const body = await req.json();

    // ✅ Now accepting full evaluation context (Blind Evaluator fix)
    const {
      userAnswer,
      answer,
      question,        // ← THE FIX: question is now required
      topic,
      difficulty,
      session_id,
      company,
      role,
      expectedConcepts = [],
      previousMistakes = [],
      weakConcepts = [],
      strongConcepts = [],
    } = body;
    const answerText = typeof userAnswer === "string" ? userAnswer : answer;

    if (!answerText || typeof answerText !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid answer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!session_id || typeof session_id !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing session_id",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Missing question — cannot evaluate without context" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ Verify user
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      console.error("JWT validation failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isHR = topic === "hr";

    const companyStyle = company ? COMPANY_STYLE[String(company).toLowerCase()] : undefined;
    const companyContext = company && role
      ? `\n\nCompany context: This is a ${company} interview for a ${role} position.`
      : "";
    const companyStyleContext = companyStyle
      ? `\nCompany interviewer behavior:
- Focus: ${companyStyle.focus}
- Evaluation bias: ${companyStyle.evaluationBias}
- Follow-up style: ${companyStyle.followupStyle}`
      : "";

    // ✅ Expected concepts context
    const conceptsContext = expectedConcepts.length > 0
      ? `\n\nExpected concepts in a strong answer: ${expectedConcepts.join(", ")}.`
      : "";

    // ✅ Previous mistakes context (system memory)
    const mistakesContext = previousMistakes.length > 0
      ? `\n\nThis candidate has previously struggled with: ${previousMistakes.slice(-3).join(", ")}. Factor this into your feedback.`
      : "";
    const normalizedWeakConcepts = Array.isArray(weakConcepts)
      ? [...new Set(weakConcepts.map((c: unknown) => String(c).trim().toLowerCase()).filter(Boolean))]
      : [];
    const normalizedStrongConcepts = Array.isArray(strongConcepts)
      ? [...new Set(strongConcepts.map((c: unknown) => String(c).trim().toLowerCase()).filter(Boolean))]
      : [];
    const weakConceptsContext = normalizedWeakConcepts.length > 0
      ? `\n\nHistorical weak concepts: ${normalizedWeakConcepts.join(", ")}.`
      : "";
    const strongConceptsContext = normalizedStrongConcepts.length > 0
      ? `\nHistorical strong concepts: ${normalizedStrongConcepts.join(", ")}.`
      : "";

    let systemMessage: string;

    if (isHR) {
      systemMessage = `You are an expert HR interview evaluator${company ? ` for ${company}` : ""}.

You will be given the QUESTION that was asked and the CANDIDATE'S ANSWER.
Evaluate the answer strictly in context of the question asked.${companyContext}${companyStyleContext}${mistakesContext}
Evaluate considering user's historical weaknesses. If the answer improves a known weakConcept, reward improvement more strongly.${weakConceptsContext}${strongConceptsContext}

Return ONLY a JSON object:
{
  "correctness": <0.0 to 1.0 - relevance and authenticity to the question>,
  "concept_depth": <0.0 to 1.0 - structured storytelling, STAR method>,
  "confidence": <0.0 to 1.0 - confidence and self-awareness shown>,
  "clarity": <0.0 to 1.0 - communication clarity>,
  "improvementDetected": <true if the answer shows improvement in a known weak concept, else false>,
  "feedback": "<one specific, actionable sentence referencing the actual question asked>",
  "detected_concepts": ["<concept 1>", "<concept 2>"]
}

Rules:
- correctness must reflect whether the answer actually addresses the question
- feedback must mention something specific from the question or answer
- Return only valid JSON. No markdown. No explanation.`;
    } else {
      systemMessage = `You are an expert technical interview evaluator${company ? ` for ${company}` : ""}.

You will be given the QUESTION that was asked and the CANDIDATE'S ANSWER.
Evaluate the answer strictly in context of the question — not just the answer in isolation.${companyContext}${companyStyleContext}${conceptsContext}${mistakesContext}
Evaluate considering user's historical weaknesses. If the answer improves a known weakConcept, reward improvement more strongly.${weakConceptsContext}${strongConceptsContext}

Difficulty level of this question: ${difficulty ?? "medium"}

Return ONLY a JSON object:
{
  "correctness": <0.0 to 1.0 - is the answer technically correct for THIS question>,
  "concept_depth": <0.0 to 1.0 - depth of understanding demonstrated>,
  "confidence": <0.0 to 1.0 - clarity of reasoning and confidence>,
  "clarity": <0.0 to 1.0 - how well explained>,
  "improvementDetected": <true if the answer shows improvement in a known weak concept, else false>,
  "feedback": "<one specific actionable sentence that references the actual question and what was missing or strong>",
  "detected_concepts": ["<concept 1>", "<concept 2>"]
}

Rules:
- correctness must be LOW if the answer doesn't address the actual question asked
- A confident but wrong answer should score high on confidence, LOW on correctness
- feedback must be specific to the question topic, not generic
- Return only valid JSON. No markdown. No explanation.`;
    }

    // ✅ Send BOTH question and answer to the AI (the core fix)
    const userPrompt = `QUESTION ASKED:
${question}

CANDIDATE'S ANSWER:
${answerText}

Evaluate the answer in context of the question above.`;

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.2, // ✅ lower temp for more consistent evaluation
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!groqResponse.ok) {
      console.error("Groq error:", await groqResponse.text());
      throw new Error("Evaluation failed");
    }

    const groqData = await groqResponse.json();
    const raw = groqData.choices?.[0]?.message?.content?.trim() ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const evaluation = JSON.parse(clean);

    // ✅ Clamp all scores between 0 and 1
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const normalizedDetectedConcepts = Array.isArray(evaluation.detected_concepts)
      ? [...new Set(evaluation.detected_concepts.map((c: unknown) => String(c).trim().toLowerCase()).filter(Boolean))]
      : [];
    const weakConceptImproved = normalizedDetectedConcepts.some((concept: string) =>
      normalizedWeakConcepts.includes(concept)
    ) && ((Number(evaluation.correctness) ?? 0) >= 0.6 || (Number(evaluation.concept_depth) ?? 0) >= 0.6);
    const safeEval = {
      correctness:   clamp(Number(evaluation.correctness)   ?? 0.5),
      concept_depth: clamp(Number(evaluation.concept_depth) ?? 0.5),
      confidence:    clamp(Number(evaluation.confidence)    ?? 0.5),
      clarity:       clamp(Number(evaluation.clarity)       ?? 0.5),
      improvementDetected:
        typeof evaluation.improvementDetected === "boolean"
          ? evaluation.improvementDetected
          : weakConceptImproved,
      feedback:      typeof evaluation.feedback === "string" ? evaluation.feedback : "No feedback provided.",
      detected_concepts: normalizedDetectedConcepts,
    };

    const score =
      (safeEval.correctness + safeEval.concept_depth + safeEval.confidence + safeEval.clarity) / 4;
    const learningTopic =
      typeof topic === "string" && topic.trim().length > 0
        ? topic.trim().toLowerCase()
        : (company && role ? `${String(company).toLowerCase()}_${String(role).toLowerCase()}` : "general");

    try {
      const { error: attemptInsertError } = await supabaseAdmin
        .from("attempt_history")
        .insert({
          user_id: user.id,
          session_id,
          topic: learningTopic,
          difficulty: typeof difficulty === "string" ? difficulty : "medium",
          skill_index: score,
          correctness: safeEval.correctness,
          depth: safeEval.concept_depth,
          confidence: safeEval.confidence,
          clarity: safeEval.clarity,
          created_at: new Date().toISOString(),
        });

      if (attemptInsertError) {
        console.error("attempt insert failed", attemptInsertError);
        throw attemptInsertError;
      }
    } catch (attemptInsertCatchError) {
      console.error("attempt insert failed", attemptInsertCatchError);
    }

    try {
      await updateLearningState(user.id, learningTopic, score, safeEval.detected_concepts);
    } catch (learningError) {
      console.error("Learning state update failed:", learningError);
    }

    try {
      const { data: currentDimensions, error: fetchDimensionsError } = await supabaseAdmin
        .from("user_skill_dimensions")
        .select("problem_solving, concept_depth, communication, confidence, consistency")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchDimensionsError) {
        throw new Error(fetchDimensionsError.message);
      }

      const alpha = 0.3; // rolling update weight for latest attempt
      const prevProblemSolving = Number(currentDimensions?.problem_solving ?? safeEval.correctness);
      const prevConceptDepth = Number(currentDimensions?.concept_depth ?? safeEval.concept_depth);
      const prevCommunication = Number(currentDimensions?.communication ?? safeEval.clarity);
      const prevConfidence = Number(currentDimensions?.confidence ?? safeEval.confidence);
      const prevConsistency = Number(
        currentDimensions?.consistency ??
          (1 - Math.abs(safeEval.correctness - safeEval.confidence))
      );

      const newProblemSolving = prevProblemSolving * (1 - alpha) + safeEval.correctness * alpha;
      const newConceptDepth = prevConceptDepth * (1 - alpha) + safeEval.concept_depth * alpha;
      const newCommunication = prevCommunication * (1 - alpha) + safeEval.clarity * alpha;
      const newConfidence = prevConfidence * (1 - alpha) + safeEval.confidence * alpha;
      const currentConsistency = clamp(1 - Math.abs(safeEval.correctness - safeEval.confidence));
      const newConsistency = prevConsistency * (1 - alpha) + currentConsistency * alpha;

      const { error: upsertDimensionsError } = await supabaseAdmin
        .from("user_skill_dimensions")
        .upsert(
          {
            user_id: user.id,
            problem_solving: newProblemSolving,
            concept_depth: newConceptDepth,
            communication: newCommunication,
            confidence: newConfidence,
            consistency: newConsistency,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (upsertDimensionsError) {
        throw new Error(upsertDimensionsError.message);
      }
    } catch (dimensionsError) {
      console.error("Skill dimensions update failed:", dimensionsError);
    }

    try {
      await supabaseAdmin.rpc("recompute_readiness", {
        p_user: user.id,
      });
    } catch (readinessError) {
      console.error("readiness recompute failed", readinessError);
    }

    return new Response(
      JSON.stringify({ success: true, evaluation: safeEval }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Evaluate Answer Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
