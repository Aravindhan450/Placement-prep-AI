const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request): Promise<Response> => {

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {

      console.error("OPENAI_API_KEY is missing");

      return new Response(
        JSON.stringify({
          error: "Server misconfiguration",
          details: "OPENAI_API_KEY environment variable is not set"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log("OPENAI_API_KEY exists:", !!OPENAI_API_KEY);
    console.log("Calling OpenAI API...");

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a technical interviewer."
            },
            {
              role: "user",
              content: "Generate one interview question."
            }
          ]
        })
      }
    );

    console.log("OpenAI response status:", openaiResponse.status);

    if (!openaiResponse.ok) {

      const errorText = await openaiResponse.text();

      return new Response(
        JSON.stringify({
          error: "OpenAI request failed",
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await openaiResponse.json();

    if (
      !data ||
      !data.choices ||
      !Array.isArray(data.choices) ||
      data.choices.length === 0 ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {

      return new Response(
        JSON.stringify({
          error: "Invalid OpenAI response format"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const question = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        success: true,
        question: question
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  }
  catch (error) {

    return new Response(
      JSON.stringify({
        error: "Unhandled function error",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  }

});
