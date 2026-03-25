import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
}

function getSystemPrompt(feature: string): string {
  switch (feature) {
    case "interview":
      return "You are a strict interviewer conducting a mock placement interview. Ask one question at a time, evaluate answers, and give constructive feedback."
    case "resume":
      return "You are an expert HR consultant. Review the resume content provided and give specific, actionable improvement suggestions for placement success."
    case "code":
      return "You are an expert coding interview coach. Help solve DSA problems, explain time/space complexity, and suggest optimizations."
    default:
      return "You are a placement preparation assistant. Help with aptitude, reasoning, verbal ability, HR questions, and interview tips."
  }
}

async function callGroq(content: string, feature: string): Promise<string> {
  const systemPrompt = getSystemPrompt(feature)

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: content }
      ],
      max_tokens: 1024,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error("Groq error:", response.status, errText)
    throw new Error(`Groq API error: ${response.status} - ${errText}`)
  }

  const data = await response.json()
  console.log("Groq response received successfully")
  return data?.choices?.[0]?.message?.content?.trim() || "No response generated"
}

Deno.serve(async (req: Request): Promise<Response> => {

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid JWT" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const body = await req.json()
    const sessionId: string = body.sessionId
    const content: string = body.content
    const feature: string = body.feature || "chat"

    if (!sessionId || !content) {
      return new Response(
        JSON.stringify({ error: "Missing sessionId or content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Save user message
    const { error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({ session_id: sessionId, user_id: user.id, role: "user", content })

    if (insertError) {
      console.error("Insert error:", insertError)
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Call Groq
    const aiMessage = await callGroq(content, feature)

    // Save AI message
    const { error: aiInsertError } = await supabaseAdmin
      .from("messages")
      .insert({ session_id: sessionId, user_id: user.id, role: "assistant", content: aiMessage })

    if (aiInsertError) {
      console.error("AI insert error:", aiInsertError)
    }

    return new Response(
      JSON.stringify({ success: true, message: aiMessage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Function error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})