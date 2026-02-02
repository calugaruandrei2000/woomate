const sessions = new Map();

export function storeMessage(sessionId, role, content) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
  sessions.get(sessionId).push({
    role,
    content,
    timestamp: Date.now()
  });
}

export function getSession(sessionId) {
  return sessions.get(sessionId) || [];
}

export function clearSession(sessionId) {
  sessions.delete(sessionId);
}
