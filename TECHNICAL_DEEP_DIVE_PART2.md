# Technical Deep Dive - Part 2

## Data Flow & Communication

### Complete Request Flow

#### 1. PC Page Load & Session Creation

```
[PC Browser]
    │
    ├─► Load page (/)
    │   └─► app/page.tsx renders
    │
    ├─► useEffect() triggers createNewSession()
    │   │
    │   └─► POST /api/session
    │       │
    │       ├─► Generate UUID: crypto.randomUUID()
    │       ├─► Calculate expiration: Date.now() + 5min
    │       ├─► Store in memory: memoryStore.set(sessionId, data)
    │       ├─► Schedule cleanup: setTimeout(delete, 5min)
    │       │
    │       └─► Return: { sessionId, expiresAt, url }
    │
    ├─► Render QR Code
    │   └─► <QRCodeSVG value={session.url} />
    │       └─► Generates: https://ls.u4ia.site/submit/[sessionId]
    │
    └─► Establish SSE Connection
        └─► GET /api/listen/[sessionId]
            └─► Streaming connection opened
```

#### 2. Mobile Scan & Submit

```
[Mobile Browser]
    │
    ├─► Scan QR Code
    │   └─► Opens: https://ls.u4ia.site/submit/[sessionId]
    │
    ├─► app/submit/[sessionId]/page.tsx renders
    │   └─► Form with URL input field
    │
    ├─► User enters URL
    │   └─► Client-side validation
    │
    ├─► Submit form
    │   │
    │   └─► POST /api/submit/[sessionId]
    │       │
    │       ├─► Rate limit check (5 req/min)
    │       ├─► Parse body: { link }
    │       ├─► Sanitize URL
    │       ├─► Validate format
    │       ├─► Check session exists
    │       ├─► Store link: session.link = url
    │       │
    │       └─► Return: { success: true }
    │
    └─► Show success message
```

#### 3. SSE Notification & Auto-Open

```
[SSE Stream on PC]
    │
    ├─► Polling every 1 second
    │   │
    │   └─► Check: session.link exists?
    │       │
    │       ├─► No → Continue polling
    │       │
    │       └─► Yes → Send event
    │           │
    │           └─► data: {"type":"link","link":"https://..."}
    │
    ├─► Browser receives SSE event
    │   │
    │   ├─► Parse JSON data
    │   ├─► setReceivedLink(data.link)
    │   ├─► window.open(link, '_blank')
    │   └─► Close SSE connection
    │
    └─► Display success UI
```

### Sequence Diagram

```
PC Browser          API Server           Storage           Mobile Browser
    │                   │                   │                    │
    │──Load page────────┤                   │                    │
    │                   │                   │                    │
    │──POST /session───→│                   │                    │
    │                   │──Generate UUID───→│                    │
    │                   │←──Store session───│                    │
    │←──{sessionId}─────│                   │                    │
    │                   │                   │                    │
    │──Display QR───────┤                   │                    │
    │                   │                   │                    │
    │──GET /listen──────→│                   │                    │
    │←──SSE stream──────│──Poll storage────→│                    │
    │                   │                   │                    │
    │                   │                   │←──Scan QR──────────│
    │                   │                   │                    │
    │                   │←──POST /submit────────────────────────│
    │                   │──Validate URL────→│                    │
    │                   │──Store link──────→│                    │
    │                   │───────────────────→───{success}────────→│
    │                   │                   │                    │
    │                   │──Poll detects─────│                    │
    │←──SSE: link───────│                   │                    │
    │──Open link────────┤                   │                    │
    │                   │                   │                    │
```

---

## Session Management

### Session Lifecycle

#### 1. Session Creation

**Location:** `lib/storage.ts` - `createSession()`

```typescript
export async function createSession(
  sessionId: string,
  expiresAt: number
): Promise<void> {
  // Store session in memory
  memoryStore.set(sessionId, {
    expiresAt,
    createdAt: Date.now(),
    // link: undefined initially
  });
  
  // Auto-cleanup after expiration
  setTimeout(() => {
    memoryStore.delete(sessionId);
  }, expiresAt - Date.now());
}
```

**Why this works:**
- Uses JavaScript Map for O(1) lookup
- setTimeout ensures automatic cleanup
- No database required for simple use cases

#### 2. Session Data Structure

```typescript
interface SessionData {
  link?: string;        // Undefined until mobile submits
  expiresAt: number;    // Unix timestamp (Date.now() + 5min)
  createdAt: number;    // Unix timestamp of creation
}

// Example:
{
  "abc-123": {
    createdAt: 1705176000000,
    expiresAt: 1705176300000,  // 5 minutes later
    link: undefined
  }
}
```

#### 3. Session Expiration

**Three layers of expiration:**

1. **Automatic Cleanup** (Primary)
```typescript
setTimeout(() => {
  memoryStore.delete(sessionId);
}, expiresAt - Date.now());
```

2. **Validation Check** (Secondary)
```typescript
export async function getSession(sessionId: string) {
  const session = memoryStore.get(sessionId);
  
  if (!session) return null;
  
  // Check expiration
  if (Date.now() > session.expiresAt) {
    memoryStore.delete(sessionId);
    return null;
  }
  
  return session;
}
```

3. **SSE Timeout** (Tertiary)
```typescript
// In /api/listen/[sessionId]/route.ts
const maxDuration = 5 * 60 * 1000; // 5 minutes

if (Date.now() - startTime > maxDuration) {
  sendMessage({ type: 'timeout' });
  controller.close();
}
```

#### 4. Persistent Storage Across HMR

**Problem:** During development, Next.js hot module reloading clears in-memory data.

**Solution:** Use `globalThis` to persist across reloads:

```typescript
// Store on global object
const globalForStorage = globalThis as unknown as {
  memoryStore: Map<string, SessionData> | undefined;
};

// Reuse existing store or create new one
const memoryStore = 
  globalForStorage.memoryStore ?? 
  new Map<string, SessionData>();

// Persist in development
if (process.env.NODE_ENV !== 'production') {
  globalForStorage.memoryStore = memoryStore;
}
```

**How it works:**
- `globalThis` survives HMR reloads
- In production, new instance per serverless invocation (expected)
- Fixes the "Session not found" bug during development

---

## Server-Sent Events (SSE)

### Why SSE Over WebSockets?

**Advantages:**
1. **Simpler implementation** - One-way communication (server → client)
2. **HTTP-based** - Works through firewalls and proxies
3. **Automatic reconnection** - Built into EventSource API
4. **Serverless-friendly** - No persistent connections required
5. **Lower overhead** - No handshake protocol

**Trade-offs:**
- One-way only (sufficient for our use case)
- Not supported in IE (but our target is modern browsers)

### SSE Implementation Deep Dive

#### Server-Side (API Route)

**Location:** `app/api/listen/[sessionId]/route.ts`

```typescript
export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  // Create ReadableStream for SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send message helper
      const sendMessage = (data: Record<string, unknown>) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Initial connection confirmation
      sendMessage({ type: 'connected', sessionId });

      // Polling configuration
      const pollInterval = 1000;      // Check every 1 second
      const maxDuration = 5 * 60 * 1000;  // 5 minutes max
      const startTime = Date.now();

      // Polling function
      const poll = async () => {
        try {
          // Check timeout
          if (Date.now() - startTime > maxDuration) {
            sendMessage({ type: 'timeout', message: 'Session expired' });
            controller.close();
            return;
          }

          // Get session
          const session = await getSession(sessionId);

          if (!session) {
            // Grace period to avoid race conditions
            const elapsed = Date.now() - startTime;
            if (elapsed > 3000) {
              sendMessage({ type: 'error', message: 'Session not found' });
              controller.close();
            } else {
              // Keep trying
              setTimeout(poll, pollInterval);
            }
            return;
          }

          // Check for link
          if (session.link) {
            sendMessage({ type: 'link', link: session.link });
            controller.close();
            return;
          }

          // Continue polling
          setTimeout(poll, pollInterval);
        } catch (error) {
          sendMessage({ type: 'error', message: 'Internal error' });
          controller.close();
        }
      };

      // Start polling
      poll();
    },
    cancel() {
      console.log(`SSE closed for session: ${sessionId}`);
    },
  });

  // Return with SSE headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
```

**Key Concepts:**

1. **ReadableStream:** Modern streaming API for SSE
2. **TextEncoder:** Converts strings to bytes
3. **Polling:** Check storage every second (simple but effective)
4. **Grace Period:** 3-second window to handle race conditions
5. **Automatic Cleanup:** `controller.close()` terminates stream

#### Client-Side (React Component)

**Location:** `app/page.tsx`

```typescript
const listenForLink = (sessionId: string) => {
  setState('waiting');

  // Small delay to avoid race condition
  setTimeout(() => {
    // Create EventSource
    const es = new EventSource(`/api/listen/${sessionId}`);

    // Handle messages
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'connected':
          console.log('SSE connected');
          break;
          
        case 'link':
          setReceivedLink(data.link);
          setState('received');
          // Auto-open link
          window.open(data.link, '_blank', 'noopener,noreferrer');
          es.close();
          break;
          
        case 'timeout':
          setError('Session expired');
          setState('error');
          es.close();
          break;
          
        case 'error':
          setError(data.message);
          setState('error');
          es.close();
          break;
      }
    };

    // Handle connection errors
    es.onerror = (err) => {
      console.error('SSE error:', err);
      setError('Connection lost');
      setState('error');
      es.close();
    };

    setEventSource(es);
  }, 100); // 100ms delay
};
```

**Why the 100ms delay?**
- Ensures session is fully created before SSE connects
- Prevents race condition where SSE arrives before storage write
- Small enough to be imperceptible to users

#### SSE Message Format

**Standard SSE format:**
```
data: {"type":"connected","sessionId":"abc-123"}

data: {"type":"link","link":"https://github.com"}

data: {"type":"timeout","message":"Session expired"}

```

**Rules:**
- Must start with `data: `
- Must end with `\n\n` (two newlines)
- Can send JSON objects
- Each message is separate

---

