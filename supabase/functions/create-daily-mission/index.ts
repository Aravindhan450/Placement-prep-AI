import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MissionRow = {
  user_id: string;
  mission_date: string;
  topic: string;
  target_questions: number;
  completed: number;
  status: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
        status: 405,
        headers,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Missing authorization header" }), {
        status: 401,
        headers,
      });
    }
    const accessToken = authHeader.replace("Bearer ", "");

    const body = await req.json().catch(() => ({}));
    const requestedUserId = typeof body?.user_id === "string" ? body.user_id : null;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers,
      });
    }

    if (requestedUserId && requestedUserId !== user.id) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden user_id" }), {
        status: 403,
        headers,
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const userId = user.id;

    const { data: existing } = await supabaseAdmin
      .from("daily_missions")
      .select("user_id, mission_date, topic, target_questions, completed, status")
      .eq("user_id", userId)
      .eq("mission_date", today)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, mission: existing }), { status: 200, headers });
    }

    let topic = "problem solving";
    const { data: focusData, error: focusError } = await supabaseAdmin.rpc("get_focus_recommendation", {
      p_user: userId,
    });

    if (!focusError && Array.isArray(focusData) && focusData.length > 0) {
      const recommendedTopic = String((focusData[0] as { topic?: string }).topic ?? "").trim();
      if (recommendedTopic.length > 0) topic = recommendedTopic;
    }

    const mission: MissionRow = {
      user_id: userId,
      mission_date: today,
      topic,
      target_questions: 3,
      completed: 0,
      status: "active",
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("daily_missions")
      .upsert(mission, { onConflict: "user_id,mission_date" })
      .select("user_id, mission_date, topic, target_questions, completed, status")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return new Response(JSON.stringify({ success: true, mission: inserted }), { status: 200, headers });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers }
    );
  }
});
