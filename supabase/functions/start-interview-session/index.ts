import OpenAI from "npm:openai@6.34.0";

type Difficulty = "easy" | "medium" | "hard";

type EvaluationScores = {
  correctness: number;
  clarity: number;
  depth: number;
  confidence: number;
  feedback: string;
};

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const client = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: OPENROUTER_BASE_URL,
});

function assertOpenRouterKey(): void {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY environment variable");
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 400;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const waitMs = baseDelayMs * attempt;
      await sleep(waitMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Operation failed after retries");
}

function extractJsonObject(rawText: string): Record<string, unknown> | null {
  const text = rawText.trim().replace(/```json|```/gi, "").trim();

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // continue to fallback extraction
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = text.slice(firstBrace, lastBrace + 1);
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeScore(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error("Invalid numeric score");
  }

  // Primary target scale is 0-10. Keep backward compatibility for 0-1 / 0-100.
  const normalized = value <= 1 ? value * 10 : value > 10 ? value / 10 : value;
  return Number(clamp(normalized, 0, 10).toFixed(1));
}

function parseEvaluation(raw: string): EvaluationScores {
  const json = extractJsonObject(raw);
  if (!json) {
    throw new Error("Model output is not valid JSON");
  }

  const feedback = typeof json.feedback === "string" ? json.feedback.trim() : "";
  if (!feedback) {
    throw new Error("Missing feedback in model output");
  }

  return {
    correctness: normalizeScore(json.correctness),
    clarity: normalizeScore(json.clarity),
    depth: normalizeScore(json.depth),
    confidence: normalizeScore(json.confidence),
    feedback,
  };
}

export async function generateQuestion(topic: string, difficulty: Difficulty): Promise<string> {
  assertOpenRouterKey();

  const cleanTopic = String(topic ?? "").trim();
  const cleanDifficulty = String(difficulty ?? "").trim().toLowerCase();

  if (!cleanTopic) {
    throw new Error("topic is required");
  }

  if (!["easy", "medium", "hard"].includes(cleanDifficulty)) {
    throw new Error("difficulty must be one of: easy, medium, hard");
  }

  return withRetry(async () => {
    const completion = await client.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      temperature: 0.7,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content:
            "You are an experienced technical interviewer.",
        },
        {
          role: "user",
          content: `Generate ONE interview question based on:
Topic: ${cleanTopic}
Difficulty: ${cleanDifficulty}

Rules:
- Do NOT provide the answer
- Keep it concise (max 3-4 lines)
- Make it realistic (similar to actual interviews)
- Focus on conceptual understanding, not trivia

Output:
Only the question text. No explanation.`,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) {
      throw new Error("Empty question returned by model");
    }

    const question = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join("\n");

    if (!question) {
      throw new Error("Invalid question generated");
    }

    return question;
  });
}

export async function evaluateAnswer(question: string, answer: string): Promise<EvaluationScores> {
  assertOpenRouterKey();

  const cleanQuestion = String(question ?? "").trim();
  const cleanAnswer = String(answer ?? "").trim();

  if (!cleanQuestion) {
    throw new Error("question is required");
  }

  if (!cleanAnswer) {
    throw new Error("answer is required");
  }

  return withRetry(async () => {
    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-120b:free",
      temperature: 0.1,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a strict technical interviewer.

Evaluate the candidate's answer based on:
1. Correctness (technical accuracy)
2. Clarity (how well it's explained)
3. Depth (level of understanding)
4. Confidence (how confidently it is presented)

Instructions:
- Be strict but fair
- Do NOT give overly high scores
- Penalize incorrect or vague explanations
- Reward clear and structured answers

Return ONLY valid JSON:
{
  "correctness": number (0-10),
  "clarity": number (0-10),
  "depth": number (0-10),
  "confidence": number (0-10),
  "feedback": "2-3 line improvement feedback"
}`,
        },
        {
          role: "user",
          content: `Question:
${cleanQuestion}

Answer:
${cleanAnswer}`,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) {
      throw new Error("Empty evaluation returned by model");
    }

    return parseEvaluation(raw);
  }, { retries: 4, baseDelayMs: 500 });
}

export async function generateFollowUpQuestion(question: string, answer: string): Promise<string> {
  assertOpenRouterKey();

  const cleanQuestion = String(question ?? "").trim();
  const cleanAnswer = String(answer ?? "").trim();

  if (!cleanQuestion) {
    throw new Error("question is required");
  }

  if (!cleanAnswer) {
    throw new Error("answer is required");
  }

  return withRetry(async () => {
    const completion = await client.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      temperature: 0.6,
      max_tokens: 140,
      messages: [
        {
          role: "system",
          content: "You are an interviewer.",
        },
        {
          role: "user",
          content: `Based on the previous answer, generate ONE follow-up question that:
- Targets weak areas
- Increases difficulty slightly
- Tests deeper understanding

Previous Question:
${cleanQuestion}

User Answer:
${cleanAnswer}

Output:
Only the follow-up question.`,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) {
      throw new Error("Empty follow-up question returned by model");
    }

    const followUpQuestion = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join("\n");

    if (!followUpQuestion) {
      throw new Error("Invalid follow-up question generated");
    }

    return followUpQuestion;
  });
}

export async function suggestNextTopic(scores: Record<string, unknown>): Promise<string> {
  assertOpenRouterKey();

  if (!scores || typeof scores !== "object" || Array.isArray(scores)) {
    throw new Error("scores must be an object");
  }

  return withRetry(async () => {
    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-120b:free",
      temperature: 0.2,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: "You are an AI mentor.",
        },
        {
          role: "user",
          content: `Based on these scores:
${JSON.stringify(scores)}

Suggest the next topic to focus on.

Rules:
- Prioritize weakest area
- Be specific
- Keep answer short

Output:
One recommended topic with reason.`,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) {
      throw new Error("Empty next-topic recommendation returned by model");
    }

    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join("\n");
  });
}

export function calculateReadiness(scores: Omit<EvaluationScores, "feedback">): number {
  const toHundredScale = (value: number): number => {
    const clamped = clamp(value, 0, 100);
    return clamped <= 10 ? clamped * 10 : clamped;
  };

  const correctness = toHundredScale(scores.correctness);
  const clarity = toHundredScale(scores.clarity);
  const depth = toHundredScale(scores.depth);
  const confidence = toHundredScale(scores.confidence);

  const readiness =
    correctness * 0.4 +
    clarity * 0.2 +
    depth * 0.25 +
    confidence * 0.15;

  return Number(readiness.toFixed(2));
}

export async function runTestFlow(topic: string, difficulty: Difficulty, sampleAnswer: string) {
  const question = await generateQuestion(topic, difficulty);
  const evaluation = await evaluateAnswer(question, sampleAnswer);
  const readiness = calculateReadiness(evaluation);

  return {
    topic,
    difficulty,
    question,
    answer: sampleAnswer,
    evaluation,
    readiness,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    assertOpenRouterKey();

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "test-flow").trim();

    if (action === "generate-question") {
      const question = await generateQuestion(body.topic, body.difficulty);
      return new Response(JSON.stringify({ success: true, question }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (action === "evaluate-answer") {
      const evaluation = await evaluateAnswer(body.question, body.answer);
      const readiness = calculateReadiness(evaluation);

      return new Response(JSON.stringify({ success: true, evaluation, readiness }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (action === "generate-followup-question") {
      const followUpQuestion = await generateFollowUpQuestion(body.question, body.answer);
      return new Response(JSON.stringify({ success: true, followUpQuestion }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (action === "suggest-next-topic") {
      const recommendation = await suggestNextTopic(body.scores);
      return new Response(JSON.stringify({ success: true, recommendation }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Default action: full test flow
    const topic = String(body.topic ?? "JavaScript");
    const difficulty = (String(body.difficulty ?? "medium").toLowerCase() as Difficulty);
    const sampleAnswer = String(
      body.answer ??
        "I would optimize the critical path first by reducing blocking operations, caching stable data, and measuring impact with profiling before and after changes.",
    );

    const result = await runTestFlow(topic, difficulty, sampleAnswer);

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("start-interview-session error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
