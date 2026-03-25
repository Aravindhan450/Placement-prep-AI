import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fixed roadmap template structure
const ROADMAP_TEMPLATE = [
  { id: "foundation", title: "Foundations" },
  { id: "core", title: "Core Concepts" },
  { id: "advanced", title: "Advanced Topics" },
  { id: "projects", title: "Projects & Practice" },
  { id: "placement", title: "Placement Preparation" }
];

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
    const { role } = body;

    if (!role || typeof role !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      console.error("JWT validation failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating roadmap for user:", user.id, "role:", role);

    // Groq prompt - AI ONLY generates steps, NOT structure
    const prompt = `You are generating a structured learning roadmap.

Return ONLY valid JSON with NO markdown, NO code blocks, NO explanations.

Follow EXACT keys:
foundation
core
advanced
projects
placement

Rules:
- Each key contains an array of learning topics (strings).
- 4–8 items per section.
- Short phrases only (2-5 words each).
- No explanations.
- No markdown formatting.
- No extra keys.
- Return raw JSON only.

Role: ${role}

Example format:
{
  "foundation": ["Topic 1", "Topic 2"],
  "core": ["Topic 3", "Topic 4"],
  "advanced": ["Topic 5", "Topic 6"],
  "projects": ["Project 1", "Project 2"],
  "placement": ["Skill 1", "Skill 2"]
}`;

    // Call Groq API
    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a learning roadmap generator. Return only valid JSON with no markdown."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!groqResponse.ok) {
      console.error("Groq error:", await groqResponse.text());
      return new Response(
        JSON.stringify({ success: false, error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groqData = await groqResponse.json();
    let rawContent = groqData.choices?.[0]?.message?.content?.trim() ?? "";

    // Clean up markdown code blocks if present
    rawContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    console.log("AI raw response:", rawContent);

    // Parse AI response
    let aiData: Record<string, string[]>;
    try {
      aiData = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Force merge with template to guarantee structure
    const roadmap = ROADMAP_TEMPLATE.map(section => ({
      title: section.title,
      steps: Array.isArray(aiData[section.id]) ? aiData[section.id] : []
    }));

    console.log("Generated roadmap sections:", roadmap.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        roadmap,
        role 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating roadmap:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
