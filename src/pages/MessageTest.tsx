import { useState } from "react"
import {
  createChatSession,
  saveMessage,
  getMessages
} from "../lib/chatService"

export default function MessageTest() {

  const [sessionId, setSessionId] =
    useState<string>("")

  const [messages, setMessages] =
    useState<any[]>([])

  async function handleCreateSession() {

    const session =
      await createChatSession("Message Test")

    setSessionId(session.id)

    console.log("Session:", session)

  }

  async function handleSendMessage() {

    if (!sessionId) return

    const message =
      await saveMessage(
        sessionId,
        "user",
        "Hello world"
      )

    console.log("Saved:", message)

  }

  async function handleFetchMessages() {

    if (!sessionId) return

    const data =
      await getMessages(sessionId)

    setMessages(data)

    console.log("Messages:", data)

  }

  return (
    <div>

      <button onClick={handleCreateSession}>
        Create Session
      </button>

      <button onClick={handleSendMessage}>
        Send Message
      </button>

      <button onClick={handleFetchMessages}>
        Fetch Messages
      </button>

      <pre>
        {JSON.stringify(messages, null, 2)}
      </pre>

    </div>
  )

}
