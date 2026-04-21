import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env.vercel", override: false });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_KB_TABLE || "documents";

const BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE || 20);
const BATCH_DELAY_MS = Number(process.env.EMBEDDING_BATCH_DELAY_MS || 700);
const MAX_RETRIES = Number(process.env.EMBEDDING_MAX_RETRIES || 3);
const CHUNK_MIN_WORDS = 200;
const CHUNK_MAX_WORDS = 400;

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function assertEnv() {
  const missing = [];
  if (!OPENROUTER_API_KEY) missing.push("OPENROUTER_API_KEY");
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function chunkArray(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function wordCount(text) {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function splitIntoSentences(text) {
  return String(text)
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
}

function splitLongParagraph(paragraph, maxWords) {
  const sentences = splitIntoSentences(paragraph);
  if (sentences.length === 0) return [];

  const chunks = [];
  let current = [];
  let currentWords = 0;

  for (const sentence of sentences) {
    const sentenceWords = wordCount(sentence);
    if (currentWords + sentenceWords <= maxWords) {
      current.push(sentence);
      currentWords += sentenceWords;
    } else {
      if (current.length > 0) {
        chunks.push(current.join(" ").trim());
      }
      current = [sentence];
      currentWords = sentenceWords;
    }
  }

  if (current.length > 0) {
    chunks.push(current.join(" ").trim());
  }

  return chunks.filter(Boolean);
}

function chunkDocumentContent(content) {
  const paragraphs = String(content)
    .split(/\n\s*\n/g)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return [];

  // Concept-preserving strategy:
  // 1) Keep paragraph boundaries (avoid mixing concepts when possible)
  // 2) Split only oversized paragraphs by sentence
  // 3) Merge adjacent small chunks only when needed to reach minimum size
  const units = [];
  for (const paragraph of paragraphs) {
    if (wordCount(paragraph) > CHUNK_MAX_WORDS) {
      units.push(...splitLongParagraph(paragraph, CHUNK_MAX_WORDS));
    } else {
      units.push(paragraph);
    }
  }

  const chunks = [];
  let current = [];
  let currentWords = 0;

  for (const unit of units) {
    const unitWords = wordCount(unit);

    if (unitWords >= CHUNK_MIN_WORDS && unitWords <= CHUNK_MAX_WORDS) {
      if (current.length > 0) {
        chunks.push(current.join("\n\n").trim());
        current = [];
        currentWords = 0;
      }
      chunks.push(unit);
      continue;
    }

    if (currentWords + unitWords <= CHUNK_MAX_WORDS) {
      current.push(unit);
      currentWords += unitWords;
    } else {
      if (current.length > 0) {
        chunks.push(current.join("\n\n").trim());
      }
      current = [unit];
      currentWords = unitWords;
    }
  }

  if (current.length > 0) {
    chunks.push(current.join("\n\n").trim());
  }

  // Keep strictly within 200-400 words where possible.
  // If final chunk is short, merge with previous only if the merged size stays <= 400.
  if (chunks.length >= 2) {
    const lastIdx = chunks.length - 1;
    const lastWords = wordCount(chunks[lastIdx]);
    const prevWords = wordCount(chunks[lastIdx - 1]);
    if (lastWords < CHUNK_MIN_WORDS && prevWords + lastWords <= CHUNK_MAX_WORDS) {
      chunks[lastIdx - 1] = `${chunks[lastIdx - 1]}\n\n${chunks[lastIdx]}`.trim();
      chunks.pop();
    }
  }

  return chunks.filter(Boolean);
}

function toVectorLiteral(embedding) {
  return `[${embedding.join(",")}]`;
}

async function withRetry(fn, label) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[retry] ${label} failed (attempt ${attempt}/${MAX_RETRIES}): ${errorMessage}`);
      if (attempt < MAX_RETRIES) {
        await sleep(400 * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function loadDocuments(filePath) {
  const absolutePath = resolve(filePath);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Input JSON must be an array of documents");
  }

  const valid = [];
  const invalid = [];

  for (const doc of parsed) {
    const id = String(doc?.id ?? "").trim();
    const topic = String(doc?.topic ?? "").trim();
    const content = String(doc?.content ?? "").trim();

    if (!id || !isUuid(id) || !topic || !content) {
      invalid.push(doc);
      continue;
    }

    const chunkedContents = chunkDocumentContent(content);
    if (chunkedContents.length === 0) {
      invalid.push(doc);
      continue;
    }

    for (const chunk of chunkedContents) {
      valid.push({
        id: randomUUID(),
        topic,
        content: chunk,
        source_id: id,
      });
    }
  }

  return { valid, invalid, absolutePath };
}

async function generateEmbeddings(openaiClient, docs) {
  const response = await withRetry(
    () =>
      openaiClient.embeddings.create({
        model: OPENROUTER_MODEL,
        input: docs.map((doc) => doc.content),
      }),
    "embedding request",
  );

  if (!response?.data || response.data.length !== docs.length) {
    throw new Error("Embedding response size mismatch");
  }

  return response.data.map((item) => item.embedding);
}

async function storeBatch(supabase, docs, embeddings) {
  const rows = docs.map((doc, index) => ({
    id: doc.id,
    topic: doc.topic,
    content: doc.content,
    embedding: toVectorLiteral(embeddings[index]),
  }));

  await withRetry(async () => {
    const { error } = await supabase
      .from(SUPABASE_TABLE)
      .upsert(rows, { onConflict: "id" });

    if (error) {
      throw new Error(error.message);
    }
  }, "database upsert");
}

async function main() {
  try {
    assertEnv();

    const inputPath = process.argv[2];
    if (!inputPath) {
      console.error("Usage: node scripts/generate-knowledge-embeddings.js <path-to-documents.json>");
      process.exit(1);
    }

    const { valid, invalid, absolutePath } = await loadDocuments(inputPath);

    if (valid.length === 0) {
      console.error("No valid documents found. Ensure each item has valid id (uuid), topic, and content.");
      process.exit(1);
    }

    if (invalid.length > 0) {
      console.warn(`[skip] Ignoring ${invalid.length} invalid document(s) from ${absolutePath}`);
    }

    console.log(`[start] Loaded and chunked ${valid.length} document chunk(s) from ${absolutePath}`);
    console.log(`[config] model=${OPENROUTER_MODEL}, table=${SUPABASE_TABLE}, batchSize=${BATCH_SIZE}`);

    const openaiClient = new OpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost",
        "X-Title": process.env.OPENROUTER_APP_NAME || "knowledge-base-embedding-job",
      },
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const batches = chunkArray(valid, Math.max(1, BATCH_SIZE));
    let processed = 0;

    for (let i = 0; i < batches.length; i += 1) {
      const batch = batches[i];
      const batchNo = i + 1;

      console.log(`[batch ${batchNo}/${batches.length}] Processing ${batch.length} document(s)`);

      const embeddings = await generateEmbeddings(openaiClient, batch);
      await storeBatch(supabase, batch, embeddings);

      processed += batch.length;
      console.log(`[batch ${batchNo}/${batches.length}] Done (${processed}/${valid.length})`);

      if (batchNo < batches.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    console.log(`[complete] Successfully processed ${processed} document(s)`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[fatal] ${errorMessage}`);
    process.exit(1);
  }
}

main();
