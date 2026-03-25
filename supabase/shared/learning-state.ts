import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface LearningState {
  weak_concepts: string[];
  strong_concepts: string[];
  readiness_score: number;
}

function normalizeConcept(input: string): string {
  return input.trim().toLowerCase();
}

function uniqueConcepts(concepts: string[]): string[] {
  return [...new Set(concepts.map(normalizeConcept).filter(Boolean))];
}

export function getLearningStateClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export async function getLearningState(user_id: string, topic: string): Promise<LearningState> {
  const supabaseAdmin = getLearningStateClient();

  const { data, error } = await supabaseAdmin
    .from("user_learning_state")
    .select("weak_concepts, strong_concepts, readiness_score")
    .eq("user_id", user_id)
    .eq("topic", topic)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch learning state: ${error.message}`);
  }

  return {
    weak_concepts: uniqueConcepts(data?.weak_concepts ?? []),
    strong_concepts: uniqueConcepts(data?.strong_concepts ?? []),
    readiness_score: Number(data?.readiness_score ?? 0),
  };
}

export async function updateLearningState(
  user_id: string,
  topic: string,
  score: number,
  detectedConcepts: string[]
): Promise<LearningState> {
  const supabaseAdmin = getLearningStateClient();
  const current = await getLearningState(user_id, topic);
  const concepts = uniqueConcepts(detectedConcepts);

  let weak_concepts = [...current.weak_concepts];
  let strong_concepts = [...current.strong_concepts];

  if (score < 0.5) {
    weak_concepts = uniqueConcepts([...weak_concepts, ...concepts]);
    strong_concepts = strong_concepts.filter((c) => !weak_concepts.includes(c));
  } else if (score > 0.8) {
    strong_concepts = uniqueConcepts([...strong_concepts, ...concepts]);
    weak_concepts = weak_concepts.filter((c) => !strong_concepts.includes(c));
  }

  const { error } = await supabaseAdmin
    .from("user_learning_state")
    .upsert(
      {
        user_id,
        topic,
        weak_concepts,
        strong_concepts,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "user_id,topic" }
    );

  if (error) {
    throw new Error(`Failed to upsert learning state: ${error.message}`);
  }

  return {
    weak_concepts,
    strong_concepts,
    readiness_score: current.readiness_score,
  };
}
