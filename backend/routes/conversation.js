const express = require("express");
const { db, admin } = require("../services/firebase");
const genAI = require("../services/gemini");

const router = express.Router();

// PROBLEM SOLVER MODE (/api/conversation/problem-solver)
router.post("/problem-solver", async (req, res) => {
  try {
    // Validate request
    if (!req.body.message) {
      return res.status(400).json({
        error: "Message is required",
        success: false,
      });
    }

    // Generate or use existing session ID
    const sessionId =
      req.body.sessionId ||
      `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const sessionRef = db.collection("conversations").doc(sessionId);

    // Ensure conversation document exists
    await sessionRef.set(
      {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Save user message to Firestore
    await sessionRef.collection("messages").add({
      role: "user",
      parts: [{ text: req.body.message }],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Fetch conversation history ordered by timestamp
    const messagesSnapshot = await sessionRef
      .collection("messages")
      .orderBy("timestamp", "asc")
      .get();
    const contents = messagesSnapshot.docs.map((doc) => ({
      role: doc.data().role,
      parts: doc.data().parts,
    }));

    // System Instructions
    const systemInstructions = `You are a Professional Math Tutor tasked with creating detailed guides on how to solve math problems. You must check the question and must structure your response in this way:
    
    1. Identify the question being asked and try to predict the grade level of the math subject but do not mention it. Simplify your language to accommodate this prediction.
    2. Broadly explain to the user what is being asked but don't give the method and solution
    
    When prompted by the user to give a hint:
    - Explain the method needed to solve the solution but do not give the solution, give an example that can help the user understand this method.
    
    If the user asks for the solution:
    - Give the user the detailed step-by-step guide with methods used to reach the solution.
    
    The user may ask for an explanation of certain terms, in this case, explain in a simple manner in context with the problem.`;

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
    console.error("API Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate response",
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

    const sessionRef = db.collection("conversations").doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      return res
        .status(404)
        .json({ error: "Conversation not found", success: false });
    }

    // Delete messages subcollection
    const messagesSnapshot = await sessionRef.collection("messages").get();
    const batch = db.batch();
    messagesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    batch.delete(sessionRef);
    await batch.commit();

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
