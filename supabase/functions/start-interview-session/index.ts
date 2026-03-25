import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  const headers = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers }
      );
    }

    const userId =
      req.headers.get("x-supabase-auth-uid") ??
      req.headers.get("x-supabase-user-id");

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers }
      );
    }

    const body = await req.json().catch(() => ({}));

    const {
      company = null,
      role = null,
      topic = "general",
    } = body ?? {};

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabaseAdmin
      .from("interview_sessions")
      .insert({
        user_id: userId,
        company,
        role,
        topic,
        start_time: new Date().toISOString(),
        avg_score: 0,
        questions_attempted: 0,
      })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        session_id: data.id,
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error(err);

    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers }
    );
  }
});