"use client";
import { useState, useRef, useEffect } from "react";
import { Container } from "react-bootstrap";
import Header from "@/components/Header";
import PromptInput from "@/components/common/PromptInput";
import Message from "@/components/Message";

export default function Home() {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<
    { role: "user" | "assistant"; text: string; image?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load existing conversation on page load
  useEffect(() => {
    async function loadConversation() {
      try {
        // Check if we have a sessionId in localStorage first
        const storedSessionId = localStorage.getItem('sessionId');
        
        if (storedSessionId) {
          // Fetch existing messages for this session
          const messagesResponse = await fetch(`/api/conversation/${storedSessionId}`);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            if (messagesData.success && messagesData.messages.length > 0) {
              // Convert Firestore messages to frontend format
              const formattedMessages = messagesData.messages.map((msg: any) => ({
                role: msg.role,
                text: msg.parts.find((part: any) => part.text)?.text || "",
                image: msg.parts.find((part: any) => part.inlineData) ? 
                  `data:${msg.parts.find((part: any) => part.inlineData)?.inlineData?.mimeType};base64,${msg.parts.find((part: any) => part.inlineData)?.inlineData?.data}` : 
                  undefined,
              }));
              
              setConversation(formattedMessages);
              setSessionId(messagesData.sessionId);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load conversation:", error);
      } finally {
        setInitialLoading(false);
      }
    }

    loadConversation();
  }, []);

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    chatContainerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  async function sendMessage() {
    if (!message.trim() && !selectedImage) return;

    setLoading(true);

    // Add user's message with image preview if available
    const userMessage = {
      role: "user" as const,
      text: message,
      image: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
    };

    setConversation((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", text: "..." }, // Placeholder for AI response
    ]);

    const currentMessage = message;
    const currentImage = selectedImage;
    setMessage("");
    setSelectedImage(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      if (currentMessage.trim()) {
        formData.append("message", currentMessage);
      }
      if (currentImage) {
        formData.append("image", currentImage);
      }
      if (sessionId) {
        formData.append("sessionId", sessionId);
      }

      const res = await fetch("/api/conversation/problem-solver", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('sessionId', data.sessionId);
      }

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
    <div className="flex flex-col min-h-screen bg-main">
      <Header />
      <div
        className={[
          "flex flex-1 justify-center w-full py-5",
          conversation.length ? "items-start" : "items-center",
        ].join(" ")}
      >
        <Container>
          {initialLoading ? (
            <div className="text-center text-white">
              <h1 className="font-[800]">Cirno Here ᗜˬᗜ</h1>
              <p className="text-lg">Loading your conversation...</p>
            </div>
          ) : conversation.length === 0 ? (
            <div className="text-center text-white">
              <h1 className="font-[800]">Cirno Here ᗜˬᗜ</h1>
              <p className="text-lg">What do you need help with?</p>
            </div>
          ) : null}

          {conversation.map((msg, idx) => (
            <Message
              key={idx}
              role={msg.role}
              submittedMessage={msg.role === "user" ? msg.text : ""}
              response={msg.role === "assistant" ? msg.text : ""}
              image={msg.image}
              loading={loading && idx === conversation.length - 1}
            />
          ))}
          <div ref={chatContainerRef} />
        </Container>
      </div>

      <PromptInput
        sendMessage={sendMessage}
        message={message}
        setMessage={setMessage}
        loading={loading}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
      />
    </div>
  );
}
