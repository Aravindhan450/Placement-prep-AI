import process from "node:process";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.vercel", override: false });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const OPENROUTER_EMBEDDING_MODEL = process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_MATCH_RPC = "match_documents";

const CACHE_TTL_MS = Number(process.env.RETRIEVAL_CACHE_TTL_MS || 5 * 60 * 1000);
const MAX_RETRIES = Number(process.env.RETRIEVAL_MAX_RETRIES || 3);

const retrievalCache = new Map();

function assertEnv() {
  const missing = [];
  if (!OPENROUTER_API_KEY) missing.push("OPENROUTER_API_KEY");
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toVectorLiteral(embedding) {
  return `[${embedding.join(",")}]`;
}

function cacheKey(query, topic, topK) {
  const normalizedTopic = topic ? String(topic).trim().toLowerCase() : "*";
  return `${String(query).trim().toLowerCase()}::${normalizedTopic}::${topK}`;
}

function getFromCache(key) {
  const entry = retrievalCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    retrievalCache.delete(key);
    return null;
  }

  return entry.value;
}

function putInCache(key, value) {
  retrievalCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

async function withRetry(fn, label) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[retry] ${label} failed (${attempt}/${MAX_RETRIES}): ${message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(300 * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function createOpenRouterClient() {
  return new OpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost",
      "X-Title": process.env.OPENROUTER_APP_NAME || "rag-retrieval-service",
    },
  });
}

function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

async function generateQueryEmbedding(openaiClient, query) {
  const response = await withRetry(
    () =>
      openaiClient.embeddings.create({
        model: OPENROUTER_EMBEDDING_MODEL,
        input: query,
      }),
    "query embedding",
  );

  const embedding = response?.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Invalid embedding response");
  }

  return embedding;
}

export async function retrieveContext(query, topic = null) {
  try {
    assertEnv();

    const cleanQuery = String(query ?? "").trim();
    const cleanTopic = topic == null ? null : String(topic).trim();

    if (!cleanQuery) {
      throw new Error("query is required");
    }

    const key = cacheKey(cleanQuery, cleanTopic, 3);
    const cached = getFromCache(key);
    if (cached) {
      console.log(`[cache] hit query="${cleanQuery}" topic="${cleanTopic ?? "any"}"`);
      return cached;
    }

    console.log(`[cache] miss query="${cleanQuery}" topic="${cleanTopic ?? "any"}"`);

    const openaiClient = createOpenRouterClient();
    const supabase = createSupabaseClient();

    const queryEmbedding = await generateQueryEmbedding(openaiClient, cleanQuery);
    const { data, error } = await withRetry(
      () =>
        supabase.rpc(SUPABASE_MATCH_RPC, {
          query_embedding: toVectorLiteral(queryEmbedding),
          match_count: 3,
          topic_filter: cleanTopic,
        }),
      "vector similarity search",
    );

    if (error) {
      throw new Error(`Supabase retrieval failed: ${error.message}`);
    }

    const combined = (Array.isArray(data) ? data : [])
      .map((row) => String(row?.content ?? "").trim())
      .filter(Boolean)
      .slice(0, 3)
      .join("\n\n");

    putInCache(key, combined);
    return combined;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[retrieveContext] ${message}`);
    throw new Error(`Failed to retrieve context: ${message}`);
  }
}

async function main() {
  try {
    const query = process.argv[2];
    const topic = process.argv[3] || null;

    if (!query) {
      console.error("Usage: node scripts/retrieve-knowledge.js \"<query text>\" [topic]");
      process.exit(1);
    }

    const context = await retrieveContext(query, topic);
    console.log(JSON.stringify({ context }, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[fatal] ${message}`);
    process.exit(1);
  }
}

const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1]);
if (isDirectRun) {
  main();
}
