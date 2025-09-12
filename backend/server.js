require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { VertexAI } = require("@google-cloud/vertexai");

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Vertex AI
let vertex_ai = null;
let model = null;

if (process.env.GCP_PROJECT_ID && process.env.GCP_LOCATION) {
  vertex_ai = new VertexAI({
    project: process.env.GCP_PROJECT_ID,
    location: process.env.GCP_LOCATION,
    googleAuthOptions: {
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // path to service account JSON
    },
  }); 

  model = vertex_ai.getGenerativeModel({
    model: "gemini-2.5-flash", // Or gemini-1.5-pro, gemini-2.0, etc.
  });
}

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Cirno Chat API (Vertex AI) is running!",
    status: "healthy",
    vertex_connected: !!model,
  });
});

// Chat endpoint for Gemini API
app.post("/api/chat", async (req, res) => {
  try {
    if (!req.body.message) {
      return res
        .status(400)
        .json({ error: "Message is required", success: false });
    }

    if (!model) {
      return res.status(500).json({
        error: "Vertex AI not configured. Check credentials & env vars.",
        success: false,
      });
    }

    const request = {
      contents: [{ role: "user", parts: [{ text: req.body.message }] }],
    };

    const result = await model.generateContent(request);
    const text = result.response.candidates[0].content.parts[0].text;

    res.json({
      success: true,
      message: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Vertex AI Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate response",
      details: error.message,
    });
  }
});

// Problem Solver endpoint
app.post("/api/problem-solver", async (req, res) => {
  try {
    if (!req.body.message) {
      return res
        .status(400)
        .json({ error: "Message is required", success: false });
    }

    if (!model) {
      return res.status(500).json({
        error: "Vertex AI not configured. Check credentials & env vars.",
        success: false,
      });
    }

    const systemInstructions = `You are a Professional Math Tutor tasked with creating detailed guides on how to solve math problems.
1. Identify the question being asked and try to predict the grade level of the math subject but do not mention it. Simplify your language.
2. Broadly explain what is being asked but don't give the method and solution.
When prompted for a hint: explain the method needed but don’t give the final solution, use an example.
If asked for the solution: provide a detailed step-by-step guide.
If asked about terms: explain them simply in context.`;

  model = vertex_ai.getGenerativeModel({
    model: "gemini-2.5-flash", // Or gemini-1.5-pro, gemini-2.0, etc.
    systemInstruction: {
      role: `system`,
      parts: [{"text": systemInstructions}]
    },
  });
  
    const request = {
      contents: [{ role: "user", parts: [{ text: req.body.message }] }],
    };

    const result = await model.generateContent(request);
    const text = result.response.candidates[0].content.parts[0].text;

    res.json({
      success: true,
      message: text,
      mode: "problem_solver",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Problem Solver Vertex AI Error:", error);
    res.status(500).json({
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
  console.log(`Cirno Chat API (Vertex AI) is running on PORT ${PORT}`);
  console.log("Endpoints:");
  console.log("GET  /                - Health check");
  console.log("POST /api/chat        - General chat with Gemini");
  console.log("POST /api/problem-solver - Math tutor mode");
  console.log("GET  /api/models      - Available models");
});
