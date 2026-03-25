import { supabase } from "./supabase"

export async function createChatSession(title: string) {

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: user.id,
      title: title
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data

}

export async function getChatSessions() {

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return data

}

export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {

  const { data, error } = await supabase
    .from("messages")
    .insert({
      session_id: sessionId,
      role,
      content
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data

}

export async function getMessages(
  sessionId: string
) {

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })

  if (error) {
    throw error
  }

  return data

}
