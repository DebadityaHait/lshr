/**
 * Storage interface for session management
 * In production, this will use Vercel Edge Config
 * For development, we'll use an in-memory store
 */

interface SessionData {
  link?: string;
  expiresAt: number;
  createdAt: number;
}

// In-memory store for development (will be replaced by Edge Config in production)
// Use globalThis to persist across HMR in development
const globalForStorage = globalThis as unknown as {
  memoryStore: Map<string, SessionData> | undefined;
};

const memoryStore = globalForStorage.memoryStore ?? new Map<string, SessionData>();

if (process.env.NODE_ENV !== 'production') {
  globalForStorage.memoryStore = memoryStore;
}

/**
 * Check if we're using Edge Config or in-memory storage
 */
function isEdgeConfigAvailable(): boolean {
  return !!process.env.EDGE_CONFIG;
}

/**
 * Create a new session
 */
export async function createSession(sessionId: string, expiresAt: number): Promise<void> {
  if (isEdgeConfigAvailable()) {
    // In production with Edge Config, we'd use the API
    // For now, using in-memory as Edge Config requires dashboard setup
    console.log('Edge Config detected, but using in-memory store for sessions');
  }
  
  memoryStore.set(sessionId, {
    expiresAt,
    createdAt: Date.now(),
  });
  
  // Auto-cleanup after expiration
  setTimeout(() => {
    memoryStore.delete(sessionId);
  }, expiresAt - Date.now());
}

/**
 * Get session data
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const session = memoryStore.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > session.expiresAt) {
    memoryStore.delete(sessionId);
    return null;
  }
  
  return session;
}

/**
 * Store a link in a session
 */
export async function storeLink(sessionId: string, link: string): Promise<boolean> {
  const session = memoryStore.get(sessionId);
  
  if (!session) {
    return false;
  }
  
  // Check if expired
  if (Date.now() > session.expiresAt) {
    memoryStore.delete(sessionId);
    return false;
  }
  
  session.link = link;
  memoryStore.set(sessionId, session);
  
  return true;
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  memoryStore.delete(sessionId);
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const now = Date.now();
  
  for (const [sessionId, session] of memoryStore.entries()) {
    if (now > session.expiresAt) {
      memoryStore.delete(sessionId);
    }
  }
}
