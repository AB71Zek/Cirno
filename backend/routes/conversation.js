const express = require("express");
const multer = require("multer");
const genAI = require("../services/gemini");
const { compressImage, imageToBase64 } = require("../utils/imageProcessor");
const { extractAndValidateSession, setSessionCookie } = require("../utils/sessionManager");
const { 
  ensureConversationExists, 
  saveMessage, 
  getConversationMessages, 
  deleteConversation 
} = require("../services/conversationService");

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    // Define allowed image types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];
    
    // Check if file type is allowed
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Only image files (JPEG, PNG, WebP, BMP, TIFF) are supported.`), false);
    }
  }
});

// PROBLEM SOLVER MODE (/api/conversation/problem-solver) - Unified text and image support
router.post("/problem-solver", upload.single('image'), async (req, res) => {
  try {
    // Handle multer errors (file size, file type, etc.)
    if (req.fileValidationError) {
      return res.status(400).json({
        error: req.fileValidationError,
        success: false,
      });
    }
    
    // Extract and validate session first
    const { sessionId, isValid, isNew } = extractAndValidateSession(req);
    
    if (!isValid) {
      return res.status(400).json({
        error: "Invalid session ID format",
        success: false,
      });
    }

    // Ensure conversation document exists
    await ensureConversationExists(sessionId);

    // Check if this is just a sessionId request (empty message and no file)
    const isEmptyRequest = (!req.body.message || req.body.message.trim() === "") && !req.file;
    
    if (isEmptyRequest) {
      // Just return the sessionId without processing any message
      setSessionCookie(res, sessionId);
      return res.json({
        success: true,
        message: "",
        mode: "session_only",
        sessionId,
        timestamp: new Date().toISOString(),
      });
    }

    // Validate request - require either message or image for actual processing
    if (!req.body.message && !req.file) {
      return res.status(400).json({
        error: "Either a message or an image file is required. Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP, BMP, TIFF",
        success: false,
      });
    }

    // Prepare message parts
    const messageParts = [];
    
    // Add text message if provided
    if (req.body.message) {
      messageParts.push({ text: req.body.message });
    }
    
    // Add image if provided
    if (req.file) {
      // Compress image to specific dimensions at 80% quality
      const compressedImageBuffer = await compressImage(req.file.buffer);
      
      // Convert to base64 with MIME type
      const imageData = imageToBase64(compressedImageBuffer, req.file.mimetype);
      
      messageParts.push({
        inlineData: imageData
      });
    }

    // Save user message to Firestore
    await saveMessage(sessionId, "user", messageParts);

    // Fetch conversation history
    const messages = await getConversationMessages(sessionId);
    const contents = messages.map((msg) => ({
      role: msg.role,
      parts: msg.parts,
    }));

    // System Instructions
    const systemInstructions = `You are a Professional Math Tutor tasked with creating detailed guides on how to solve math problems. You must check the question and must structure your response in this way:
    
    1. Identify the question being asked and try to predict the grade level of the math subject but do not mention it. Simplify your language to accommodate this prediction.
    2. Broadly explain to the user what is being asked but don't give the method and solution
    
    When prompted by the user to give a hint:
    - Explain the method needed to solve the solution but do not give the solution, give an example that can help the user understand this method.
    
    If the user asks for the solution:
    - Give the user the detailed step-by-step guide with methods used to reach the solution.
    
    The user may ask for an explanation of certain terms, in this case, explain in a simple manner in context with the problem.
    
    When analyzing images containing math problems:
    - First describe what you see in the image clearly
    - Identify the mathematical problem or question
    - Follow the same tutoring structure as above`;

    // Call GenAI API
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

    const text = result.candidates[0].content.parts[0].text;

    // Save assistant response to Firestore
    await saveMessage(sessionId, "assistant", [{ text }]);

    // Determine response mode
    let mode = "problem_solver_text";
    if (req.file && req.body.message) {
      mode = "problem_solver_image_and_text";
    } else if (req.file) {
      mode = "problem_solver_image";
    }

    // Set sessionId cookie
    setSessionCookie(res, sessionId);

    // Return the response
    res.json({
      success: true,
      message: text,
      mode: mode,
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

// GET CONVERSATION MESSAGES (/api/conversation/:sessionId)
router.get("/:sessionId", async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    if (!sessionId) {
      return res.status(400).json({
        error: "Session ID is required",
        success: false,
      });
    }

    const messages = await getConversationMessages(sessionId);
    

    res.json({
      success: true,
      sessionId,
      messages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get Messages API Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
      details: error.message,
    });
  }
});

// DELETE CHAT (/api/conversation/:sessionId)
router.delete("/:sessionId", async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    if (!sessionId) {
      return res.status(400).json({
        error: "Session ID is required",
        success: false,
      });
    }

    await deleteConversation(sessionId);

    res.json({
      success: true,
      message: `Conversation with sessionId ${sessionId} deleted successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Delete Conversation API Error:", error);
    
    if (error.message === "Conversation not found") {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to delete conversation",
      details: error.message,
    });
  }
});

// Alternative version where it outputs a json object and leaves it to frontend to handle it
// List available modes
// router.get("/models", (req, res) => {
//   res.json({
//     success: true,
//     modes: [
//       {
//         id: "problem_solver",
//         name: "Problem Solver",
//         description: "Professional Math Tutor for step-by-step problem solving",
//         endpoint: "/api/problem-solver",
//       },
//     ],
//   });
// });

// router.post("/problem-solver/stateless", async (req, res) => {
//   try {
//     const { history = [], message } = req.body || {};
//     if (!message) {
//       return res
//         .status(400)
//         .json({ success: false, error: "Message is required" });
//     }
//     if (!genAI) {
//       return res
//         .status(500)
//         .json({ success: false, error: "Gemini not configured" });
//     }

//     const systemInstructions = `You are a Professional Math Tutor tasked with creating detailed guides on how to solve math problems. You must structure your response as a JSON object with exactly these three fields:

// 1. "initialResponse": A brief explanation of what the problem is asking, identifying the question and predicting the grade level (but don't mention the grade level). Simplify your language to accommodate this prediction.

// 2. "stepByStepSolution": An array of detailed steps showing how to solve the problem. Each step should be a string explaining the method and reasoning. Include all necessary steps to reach the final answer.

// 3. "hint": A helpful hint that explains the method needed to solve the problem without giving away the solution. Include a relevant example that can help the user understand this method.`;

//     // Create a fresh local chat with system instructions
//     const chat = genAI.chats.create({
//       model: "gemini-2.5-flash-lite",
//       config: {
//         systemInstruction: {
//           role: "system",
//           parts: [{ text: systemInstructions }],
//         },
//         maxOutputTokens: 65535,
//         temperature: 1,
//         topP: 0.95,
//         responseMimeType: "application/json",
//         responseSchema: {
//           type: "object",
//           properties: {
//             initialResponse: {
//               type: "string",
//             },
//             stepByStepSolution: {
//               type: "array",
//               items: {
//                 type: "string",
//               },
//             },
//             hint: {
//               type: "string",
//             },
//           },
//           required: ["initialResponse", "stepByStepSolution", "hint"],
//         },
//         safetySettings: [
//           { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
//           { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
//           { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
//           { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
//         ],
//       },
//     });

//     // Replay client-held history into the local chat
//     for (const turn of history) {
//       const role = turn?.role === "model" ? "model" : "user";
//       const text = String(turn?.text ?? "").trim();
//       if (!text) continue;
//       if (role === "user") {
//         await chat.sendMessage({ message: [{ text }] });
//       } else {
//         // Provide prior assistant reply as contextual note to maintain statelessness
//         await chat.sendMessage({
//           message: [
//             { text: `(Previous assistant reply for context): ${text}` },
//           ],
//         });
//       }
//     }

//     // Send current user message and stream the response
//     const stream = await chat.sendMessageStream({
//       message: [{ text: String(message) }],
//     });
//     let reply = "";
//     for await (const chunk of stream) {
//       if (chunk.text) reply += chunk.text;
//     }

//     // Parse the JSON response from the AI (should be valid JSON due to responseMimeType)
//     let structuredResponse;
//     try {
//       structuredResponse = JSON.parse(reply);
//     } catch (parseError) {
//       console.error("Failed to parse AI response as JSON:", parseError);
//       // Fallback to original format if JSON parsing fails
//       return res.json({
//         success: true,
//         message: reply,
//         mode: "problem_solver_stateless",
//         timestamp: new Date().toISOString(),
//       });
//     }

//     // Return the structured JSON response
//     return res.json({
//       success: true,
//       initialResponse: structuredResponse.initialResponse || "",
//       stepByStepSolution: structuredResponse.stepByStepSolution || [],
//       hint: structuredResponse.hint || "",
//       mode: "problem_solver_stateless",
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("Problem Solver (stateless) API Error:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to generate response",
//       details: error.message,
//     });
//   }
// });

module.exports = router;
