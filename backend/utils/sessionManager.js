/**
 * Session Management Utilities
 * Handles sessionId generation, cookie management, and session validation
 */

/**
 * Generate a new session ID
 * @returns {string} Unique session identifier
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Extract sessionId from request (body, cookies, or generate new)
 * @param {Object} req - Express request object
 * @returns {string} Session ID
 */
function getSessionId(req) {
  return (
    req.body.sessionId ||
    req.cookies?.sessionId ||
    generateSessionId()
  );
}

/**
 * Set sessionId cookie in response
 * @param {Object} res - Express response object
 * @param {string} sessionId - Session ID to set
 */
function setSessionCookie(res, sessionId) {
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: false, // Set to false for development (HTTP)
    sameSite: 'lax', // More permissive for development
    path: '/' // Ensure cookie is available for all paths
  });
}

/**
 * Validate sessionId format
 * @param {string} sessionId - Session ID to validate
 * @returns {boolean} True if valid format
 */
function isValidSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return false;
  }
  
  // Check if it matches our session format
  return /^session_\d+_[a-z0-9]+$/.test(sessionId);
}

/**
 * Extract sessionId from request and validate it
 * @param {Object} req - Express request object
 * @returns {Object} { sessionId: string, isValid: boolean, isNew: boolean }
 */
function extractAndValidateSession(req) {
  const sessionId = getSessionId(req);
  const isValid = isValidSessionId(sessionId);
  const isNew = !req.cookies?.sessionId && !req.body.sessionId;
  
  return {
    sessionId,
    isValid,
    isNew
  };
}

module.exports = {
  generateSessionId,
  getSessionId,
  setSessionCookie,
  isValidSessionId,
  extractAndValidateSession
};
