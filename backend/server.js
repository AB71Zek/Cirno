require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
const admin = require("firebase-admin");
const app = express();

app.use(express.json());
app.use(cors());

// Initialize Firebase Admin SDK
const serviceAccount = require(process.env.FIREBASE_CREDENTIALS_PATH);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const genAI = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_LOCATION,
});

//  Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Cirno Chat API is running!",
    status: "healthy",
    gemini_connected: !!genAI,
  });
});

// Chat endpoint for Gemini API
app.post("/api/chat", async (req, res) => {
  try {
    // Validate request
    if (!req.body.message) {
      return res.status(400).json({
        error: "Message is required",
        success: false,
      });
    }

    // Check if Gemini is configured
    if (!genAI) {
      return res.status(500).json({
        error: "Gemini API not configured. Please check your API key.",
        success: false,
      });
    }

    // Generate content using the correct API
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: { role: "user", parts: [{ text: req.body.message }] },
    });

    // Extract the response text
    const text = result.candidates[0].content.parts[0].text;

    // Return the response
    res.json({
      success: true,
      message: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate response",
      details: error.message,
    });
  }
});

// Problem Solver mode endpoint - specialized math tutor
app.post("/api/problem-solver", async (req, res) => {
  try {
    // Validate request
    if (!req.body.message) {
      return res.status(400).json({
        error: "Message is required",
        success: false,
      });
    }

    // Get or generate session ID
    const sessionId =
      req.body.sessionId ||
      `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Add user message to Firestore
    const sessionRef = db.collection("conversations").doc(sessionId);

    // Ensure conversation document exists
    await sessionRef.set(
      {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await sessionRef.collection("messages").add({
      role: "user",
      parts: [{ text: req.body.message }],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Check if Gemini is configured
    if (!genAI) {
      return res.status(500).json({
        error: "Gemini API not configured. Please check your API key.",
        success: false,
      });
    }

    // Fetch conversation history from Firestore
    const messagesSnapshot = await sessionRef
      .collection("messages")
      .orderBy("timestamp", "asc")
      .get();
    const contents = messagesSnapshot.docs.map((doc) => ({
      role: doc.data().role,
      parts: doc.data().parts,
    }));

    // System Instructions for Cirno math tutor
    const systemInstructions = `You are a Professional Math Tutor tasked with creating detailed guides on how to solve math problems. You must check the question and must structure your response in this way:

1. Identify the question being asked and try to predict the grade level of the math subject but do not mention it. Simplify your language to accommodate this prediction.
2. Broadly explain to the user what is being asked but don't give the method and solution

When prompted by the user to give a hint:
- Explain the method needed to solve the solution but do not give the solution, give an example that can help the user understand this method.

If the user asks for the solution:
- Give the user the detailed step-by-step guide with methods used to reach the solution.

The user may ask for an explanation of certain terms, in this case, explain in a simple manner in context with the problem.`;

    // Generate content with system instructions
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      temperature: 0.1,
      topP: 0.8,
      config: {
        systemInstruction: {
          role: "system",
          parts: [{ text: systemInstructions }],
        },
      },
      contents,
    });

    // Extract the response text
    const text = result.candidates[0].content.parts[0].text;

    // Add AI response to Firestore
    await sessionRef.collection("messages").add({
      role: "assistant",
      parts: [{ text }],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Return the response
    res.json({
      success: true,
      message: text,
      mode: "problem_solver",
      sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Problem Solver API Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate response",
      details: error.message,
    });
  }
});

app.delete("/api/conversation/:sessionId", async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        error: "Session ID is required",
        success: false,
      });
    }

    const sessionRef = db.collection("conversations").doc(sessionId);

    // Delete all messages in the conversation
    const messagesSnapshot = await sessionRef.collection("messages").get();
    if (messagesSnapshot.empty) {
      return res
        .status(404)
        .json({ error: "Conversation not found", success: false });
    }
    const batch = db.batch();
    messagesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    batch.delete(sessionRef);

    await batch.commit();

    // Return success response
    res.json({
      success: true,
      message: `Conversation with sessionId ${sessionId} deleted successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Delete Conversation API Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete conversation",
      details: error.message,
    });
  }
});

// Stateless Problem Solver: client sends full conversation history each call
app.post("/api/problem-solver/stateless", async (req, res) => {
  try {
    const { history = [], message } = req.body || {};
    if (!message) {
      return res
        .status(400)
        .json({ success: false, error: "Message is required" });
    }
    if (!genAI) {
      return res
        .status(500)
        .json({ success: false, error: "Gemini not configured" });
    }

    const systemInstructions = `You are a Professional Math Tutor tasked with creating detailed guides on how to solve math problems. You must structure your response as a JSON object with exactly these three fields:

1. "initialResponse": A brief explanation of what the problem is asking, identifying the question and predicting the grade level (but don't mention the grade level). Simplify your language to accommodate this prediction.

2. "stepByStepSolution": An array of detailed steps showing how to solve the problem. Each step should be a string explaining the method and reasoning. Include all necessary steps to reach the final answer.

3. "hint": A helpful hint that explains the method needed to solve the problem without giving away the solution. Include a relevant example that can help the user understand this method.`;

    // Create a fresh local chat with system instructions
    const chat = genAI.chats.create({
      model: "gemini-2.5-flash-lite",
      config: {
        systemInstruction: {
          role: "system",
          parts: [{ text: systemInstructions }],
        },
        maxOutputTokens: 65535,
        temperature: 1,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            initialResponse: {
              type: "string",
            },
            stepByStepSolution: {
              type: "array",
              items: {
                type: "string",
              },
            },
            hint: {
              type: "string",
            },
          },
          required: ["initialResponse", "stepByStepSolution", "hint"],
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
        ],
      },
    });

    // Replay client-held history into the local chat
    for (const turn of history) {
      const role = turn?.role === "model" ? "model" : "user";
      const text = String(turn?.text ?? "").trim();
      if (!text) continue;
      if (role === "user") {
        await chat.sendMessage({ message: [{ text }] });
      } else {
        // Provide prior assistant reply as contextual note to maintain statelessness
        await chat.sendMessage({
          message: [
            { text: `(Previous assistant reply for context): ${text}` },
          ],
        });
      }
    }

    // Send current user message and stream the response
    const stream = await chat.sendMessageStream({
      message: [{ text: String(message) }],
    });
    let reply = "";
    for await (const chunk of stream) {
      if (chunk.text) reply += chunk.text;
    }

    // Parse the JSON response from the AI (should be valid JSON due to responseMimeType)
    let structuredResponse;
    try {
      structuredResponse = JSON.parse(reply);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback to original format if JSON parsing fails
      return res.json({
        success: true,
        message: reply,
        mode: "problem_solver_stateless",
        timestamp: new Date().toISOString(),
      });
    }

    // Return the structured JSON response
    return res.json({
      success: true,
      initialResponse: structuredResponse.initialResponse || "",
      stepByStepSolution: structuredResponse.stepByStepSolution || [],
      hint: structuredResponse.hint || "",
      mode: "problem_solver_stateless",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Problem Solver (stateless) API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate response",
      details: error.message,
    });
  }
});

// Get available models endpoint
app.get("/api/models", (req, res) => {
  res.json({
    success: true,
    modes: [
      {
        id: "problem_solver",
        name: "Problem Solver",
        description: "Professional Math Tutor for step-by-step problem solving",
        endpoint: "/api/problem-solver",
      },
    ],
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Cirno Chat API server is running on PORT ${PORT}`);
  console.log(`API Endpoints:`);
  console.log(`GET  / - Health check`);
  console.log(`POST /api/chat - Send message to Gemini`);
  console.log(`POST /api/problem-solver - Math tutor mode`);
  console.log(
    `DELETE /api/conversation/:sessionId - Delete conversation history`
  );
  console.log(`GET  /api/models - Available models and modes`);
});
