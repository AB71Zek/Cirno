"use client";
import { useState } from "react";
import { Container } from "react-bootstrap";
import Header from "@/components/Header";
import PromptInput from "@/components/common/PromptInput";
import Message from "@/components/Message";

export default function Home() {
  const [message, setMessage] = useState("");
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  async function sendMessage() {
    if (!message.trim()) return;

    setLoading(true);
    setResponse("");
    setHasSent(true);
    setSubmittedMessage(message);

    try {
      const res = await fetch("/api/problem-solver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      setResponse(data.message || "No response from server");
    } catch (err) {
      setResponse(`Something went wrong: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 items-center justify-center w-full">
        <Container>
          {!hasSent && (
            <div className="text-center">
              <h1 className="font-[800]">Cirno Here ᗜˬᗜ</h1>
              <p className="text-lg">What do you need help with?</p>
            </div>
          )}
          {hasSent && (
            <Message
              submittedMessage={submittedMessage}
              response={response}
              loading={loading}
            />
          )}
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
