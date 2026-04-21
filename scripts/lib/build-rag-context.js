import process from "node:process";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getEmbedding } from "./get-embedding.js";

dotenv.config();
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.vercel", override: false });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_MATCH_RPC = "match_documents";
const TOP_K = 3;
const RETRIEVAL_CACHE_TTL_MS = Number(process.env.RETRIEVAL_CACHE_TTL_MS || 5 * 60 * 1000);

const retrievalCache = new Map();

function assertEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function toVectorLiteral(embedding) {
  return `[${embedding.join(",")}]`;
}

function makeCacheKey(question, topic) {
  return `${question.trim().toLowerCase()}::${topic ? topic.trim().toLowerCase() : "*"}`;
}

function getCached(key) {
  const entry = retrievalCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    retrievalCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  retrievalCache.set(key, {
    value,
    expiresAt: Date.now() + RETRIEVAL_CACHE_TTL_MS,
  });
}

function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

async function fetchMatches(supabase, embedding, topic) {
  const { data, error } = await supabase.rpc(SUPABASE_MATCH_RPC, {
    query_embedding: toVectorLiteral(embedding),
    match_count: TOP_K,
    filter_topic: topic,
  });

  if (error) {
    throw new Error(`Supabase RPC failed: ${error.message}`);
  }

  return Array.isArray(data)
    ? data
      .map((row) => ({
        id: String(row?.id ?? ""),
        topic: String(row?.topic ?? ""),
        content: String(row?.content ?? "").trim(),
        similarity: typeof row?.similarity === "number" ? row.similarity : null,
      }))
      .filter((row) => row.content)
      .slice(0, TOP_K)
    : [];
}

function logMatchSummary(matches, topicLabel) {
  console.log(`[rag] Supabase returned ${matches.length} result(s) for topic="${topicLabel}"`);
  if (matches.length === 0) return;

  const similarityList = matches
    .map((m, idx) => {
      const score = typeof m.similarity === "number" ? m.similarity.toFixed(4) : "n/a";
      return `#${idx + 1}:${score}`;
    })
    .join(", ");
  console.log(`[rag] similarity scores -> ${similarityList}`);
}

function buildFallbackContext(question, topic) {
  const topicHint = topic ? ` within topic "${topic}"` : "";
  return [
    `No direct knowledge-base matches were found${topicHint}.`,
    `Use first-principles reasoning for: ${question}`,
    "Cover definition, core mechanism, edge cases, trade-offs, and one practical example.",
  ].join("\n");
}

/**
 * Build RAG context for a question using vector search with topic fallback.
 * Uses embedding cache from getEmbedding() and retrieval cache in this module.
 * @param {string} question
 * @param {string | null | undefined} topic
 * @returns {Promise<string>}
 */
export async function buildRAGContext(question, topic = null) {
  try {
    assertEnv();

    const cleanQuestion = String(question ?? "").trim();
    const cleanTopic = topic == null ? null : String(topic).trim();

    if (!cleanQuestion) {
      throw new Error("question is required");
    }

    const key = makeCacheKey(cleanQuestion, cleanTopic);
    const cached = getCached(key);
    if (cached) {
      console.log(`[rag] cache hit question="${cleanQuestion}" topic="${cleanTopic ?? "any"}"`);
      return cached;
    }

    console.log(`[rag] cache miss question="${cleanQuestion}" topic="${cleanTopic ?? "any"}"`);

    console.log(`[rag] generating embedding for question (len=${cleanQuestion.length})`);
    const embedding = await getEmbedding(cleanQuestion);
    console.log(`[rag] embedding ready (dims=${embedding.length})`);

    const supabase = createSupabaseClient();

    let matches = await fetchMatches(supabase, embedding, cleanTopic);
    logMatchSummary(matches, cleanTopic ?? "any");

    if (matches.length === 0 && cleanTopic) {
      console.log(`[rag] no matches for topic="${cleanTopic}", retrying without topic filter`);
      matches = await fetchMatches(supabase, embedding, null);
      logMatchSummary(matches, "any");
    }

    const context = matches.length > 0
      ? matches.map((m) => m.content).join("\n\n")
      : buildFallbackContext(cleanQuestion, cleanTopic);

    if (matches.length === 0) {
      console.warn("[rag] empty retrieval after fallback, returning generated fallback context");
    }

    setCached(key, context);

    console.log(`[rag] context built with ${matches.length} retrieved document(s), chars=${context.length}`);
    return context;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[buildRAGContext] ${message}`);
    throw new Error(`Failed to build RAG context: ${message}`);
  }
}
