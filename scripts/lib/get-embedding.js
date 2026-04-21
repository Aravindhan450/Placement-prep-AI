import process from "node:process";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.vercel", override: false });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const OPENROUTER_EMBEDDING_MODEL = process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";

const embeddingCache = new Map();
const MAX_RETRIES = 2;

const client = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: OPENROUTER_BASE_URL,
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost",
    "X-Title": process.env.OPENROUTER_APP_NAME || "embedding-service",
  },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate embedding for text using OpenRouter with caching and retries.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text) {
  const cleanText = String(text ?? "").trim();

  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  if (!cleanText) {
    throw new Error("text is required");
  }

  if (embeddingCache.has(cleanText)) {
    console.log(`[embedding] cache hit (len=${cleanText.length})`);
    return embeddingCache.get(cleanText);
  }

  console.log(`[embedding] cache miss (len=${cleanText.length})`);

  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await client.embeddings.create({
        model: OPENROUTER_EMBEDDING_MODEL,
        input: cleanText,
      });

      const embedding = response?.data?.[0]?.embedding;
      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        throw new Error("Invalid embedding response");
      }

      embeddingCache.set(cleanText, embedding);
      console.log(`[embedding] generated and cached (dims=${embedding.length})`);
      return embedding;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[embedding] attempt ${attempt + 1}/${MAX_RETRIES + 1} failed: ${message}`);

      if (attempt < MAX_RETRIES) {
        await sleep(300 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Embedding generation failed");
}
