// Conversation History Service - Handles all Firestore operations for conversation management
const { db, admin } = require("../services/firebase");


// Ensure conversation document exists in Firestore
async function ensureConversationExists(sessionId) {
  const sessionRef = db.collection("conversations").doc(sessionId);
  
  await sessionRef.set(
    {
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

// Save a message to Firestore
async function saveMessage(sessionId, role, parts) {
  const sessionRef = db.collection("conversations").doc(sessionId);
  
  const messageRef = await sessionRef.collection("messages").add({
    role,
    parts,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return messageRef.id;
}


// Fetch all messages for a conversation

async function getConversationMessages(sessionId) {
  const sessionRef = db.collection("conversations").doc(sessionId);
  
  // Check if conversation exists
  const sessionDoc = await sessionRef.get();
  if (!sessionDoc.exists) {
    return [];
  }
  
  // Fetch messages ordered by timestamp
  const messagesSnapshot = await sessionRef
    .collection("messages")
    .orderBy("timestamp", "asc")
    .get();
  
  return messagesSnapshot.docs.map((doc) => ({
    id: doc.id,
    role: doc.data().role,
    parts: doc.data().parts,
    timestamp: doc.data().timestamp,
  }));
}


// Delete entire conversation and all its messages

async function deleteConversation(sessionId) {
  const sessionRef = db.collection("conversations").doc(sessionId);
  
  // Check if conversation exists
  const sessionDoc = await sessionRef.get();
  if (!sessionDoc.exists) {
    throw new Error("Conversation not found");
  }
  
  // Delete messages subcollection
  const messagesSnapshot = await sessionRef.collection("messages").get();
  const batch = db.batch();
  
  messagesSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  // Delete conversation document
  batch.delete(sessionRef);
  await batch.commit();
}

// Get conversation metadata (creation date, message count, etc.)

async function getConversationMetadata(sessionId) {
  const sessionRef = db.collection("conversations").doc(sessionId);
  const sessionDoc = await sessionRef.get();
  
  if (!sessionDoc.exists) {
    return null;
  }
  
  const messagesSnapshot = await sessionRef.collection("messages").get();
  
  return {
    sessionId,
    createdAt: sessionDoc.data().createdAt,
    messageCount: messagesSnapshot.size,
    lastActivity: messagesSnapshot.docs.length > 0 
      ? messagesSnapshot.docs[messagesSnapshot.docs.length - 1].data().timestamp
      : null
  };
}

module.exports = {
  ensureConversationExists,
  saveMessage,
  getConversationMessages,
  deleteConversation,
  getConversationMetadata
};
