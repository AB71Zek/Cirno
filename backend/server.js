require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
const app = express();

app.use(express.json());
app.use(cors());

const genAI = new GoogleGenAI({
    vertexai: true,
    project: process.env.GCP_PROJECT_ID,
    location: process.env.GCP_LOCATION,
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Cirno Chat API is running!",
    status: "healthy",
    gemini_connected: !!genAI
  });
});

// Chat endpoint for Gemini API
app.post("/api/chat", async (req, res) => {
  try {
    // Validate request
    if (!req.body.message) {
      return res.status(400).json({ 
        error: "Message is required",
        success: false 
      });
    }

    // Check if Gemini is configured
    if (!genAI) {
      return res.status(500).json({ 
        error: "Gemini API not configured. Please check your API key.",
        success: false 
      });
    }

    // Generate content using the correct API
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: {"role": "user", parts: [{ text: req.body.message }] }
    });

    // Extract the response text
    const text = result.candidates[0].content.parts[0].text;

    // Return the response
    res.json({
      success: true,
      message: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate response",
      details: error.message
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
        success: false 
      });
    }

    // Check if Gemini is configured
    if (!genAI) {
      return res.status(500).json({ 
        error: "Gemini API not configured. Please check your API key.",
        success: false 
      });
    }

    // System instructions for the math tutor
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
      config: {
        systemInstruction: {role: "system", parts: [{text: systemInstructions}]}
    },
      contents: {"role": "user", parts: [{ text: req.body.message }] }
    });

    // Extract the response text
    const text = result.candidates[0].content.parts[0].text;

    // Return the response
    res.json({
      success: true,
      message: text,
      mode: "problem_solver",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Problem Solver API Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate response",
      details: error.message
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
        endpoint: "/api/problem-solver"
      }
    ]
  });
});

const PORT = process.env.PORT || 5000;

// Validate that Google API key is configured
if (!process.env.GOOGLE_API_KEY) {
  console.warn('Warning: GOOGLE_API_KEY not found in environment variables');
  console.warn('Please create a .env file with your Google API key');
  console.warn('Get your API key from: https://aistudio.google.com/');
} else {
  console.log('Gemini API configured successfully');
}

app.listen(PORT, () => {
  console.log(`Cirno Chat API server is running on PORT ${PORT}`);
  console.log(`API Endpoints:`);
  console.log(`GET  / - Health check`);
  console.log(`POST /api/chat - Send message to Gemini`);
  console.log(`POST /api/problem-solver - Math tutor mode`);
  console.log(`GET  /api/models - Available models and modes`);
});