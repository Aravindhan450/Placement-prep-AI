import { supabase } from "./supabase"

interface SendMessageResponse {
  success: boolean
  message: string
}

export async function sendMessage(
  sessionId: string,
  content: string,
  feature: "chat" | "interview" | "resume" | "code" = "chat"
): Promise<SendMessageResponse> {

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) throw new Error("No active session - user must be logged in")

  const { data, error } = await supabase.functions.invoke("send-message", {
    body: {
      sessionId,
      content,
      feature  // ✅ added
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error) {
    console.error("Edge function error:", error)
    throw error
  }

  return data as SendMessageResponse
}