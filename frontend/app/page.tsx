"use client";
import { useState } from "react";
import { Container } from "react-bootstrap";
import Header from "@/components/Header";
import PromptInput from "@/components/common/PromptInput";
import Message from "@/components/Message";

export default function Home() {
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!message.trim()) return;

    setLoading(true);

    // Add user's message
    setConversation((prev) => [
      ...prev,
      { role: "user", text: message },
      { role: "assistant", text: "..." }, // Placeholder for AI response
    ]);

    const currentMessage = message;
    setMessage("");

    try {
      const res = await fetch("/api/conversation/problem-solver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage, sessionId }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (data.sessionId && !sessionId) setSessionId(data.sessionId);

      // Replace placeholder with actual AI response
      setConversation((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 ? { ...msg, text: data.message } : msg
        )
      );
    } catch (err) {
      setConversation((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1 ? { ...msg, text: `Error: ${err}` } : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div
        className={[
          "flex flex-1 justify-center w-full py-5",
          conversation.length ? "items-start" : "items-center",
        ].join(" ")}
      >
        <Container>
          {conversation.length === 0 && (
            <div className="text-center">
              <h1 className="font-[800]">Cirno Here ᗜˬᗜ</h1>
              <p className="text-lg">What do you need help with?</p>
            </div>
          )}

          {conversation.map((msg, idx) => (
            <Message
              key={idx}
              role={msg.role}
              submittedMessage={msg.role === "user" ? msg.text : ""}
              response={msg.role === "assistant" ? msg.text : ""}
              loading={loading && idx === conversation.length - 1}
            />
          ))}
        </Container>
      </div>
      
      <PromptInput
        sendMessage={sendMessage}
        message={message}
        setMessage={setMessage}
        loading={loading}
      />
    </div>
  );
}
