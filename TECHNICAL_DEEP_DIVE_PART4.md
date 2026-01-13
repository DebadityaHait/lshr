# Technical Deep Dive - Part 4

## Security & Rate Limiting

### URL Validation & Sanitization

#### Three-Layer Security Model

```
User Input
    │
    ├─► Layer 1: Type Validation
    │   └─► Ensure input is string
    │
    ├─► Layer 2: Protocol Sanitization
    │   └─► Block dangerous protocols
    │
    └─► Layer 3: Format Validation
        └─► Verify valid URL structure
```

#### Implementation

**Location:** `lib/utils.ts`

##### 1. Sanitization Function

```typescript
export function sanitizeUrl(urlString: string): string {
  const url = urlString.trim();
  
  // Prevent dangerous protocols
  if (url.toLowerCase().startsWith('javascript:') || 
      url.toLowerCase().startsWith('data:') ||
      url.toLowerCase().startsWith('vbscript:')) {
    throw new Error('Invalid URL protocol');
  }
  
  return url;
}
```

**Why block these protocols?**
- `javascript:` - Can execute arbitrary JavaScript code
- `data:` - Can embed malicious content (XSS)
- `vbscript:` - Legacy but still dangerous

**Example attacks prevented:**
```javascript
// These would all be blocked:
"javascript:alert('XSS')"
"data:text/html,<script>alert('XSS')</script>"
"vbscript:msgbox('XSS')"
```

##### 2. Validation Function

```typescript
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
```

**How it works:**
- Uses browser's built-in `URL` constructor
- Validates URL structure automatically
- Only allows HTTP/HTTPS protocols
- Returns false for malformed URLs

**Examples:**
```typescript
isValidUrl("https://github.com")      // ✅ true
isValidUrl("http://example.com")      // ✅ true
isValidUrl("ftp://server.com")        // ❌ false
isValidUrl("not a url")               // ❌ false
isValidUrl("javascript:alert(1)")     // ❌ false
```

#### Complete Validation Pipeline

```typescript
// In /api/submit/[sessionId]/route.ts

// Step 1: Check if link exists
if (!link || typeof link !== 'string') {
  return NextResponse.json({ error: 'Link is required' }, { status: 400 });
}

// Step 2: Sanitize
let sanitizedUrl: string;
try {
  sanitizedUrl = sanitizeUrl(link);
} catch {
  return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
}

// Step 3: Validate
if (!isValidUrl(sanitizedUrl)) {
  return NextResponse.json(
    { error: 'Invalid URL format. Please provide a valid http or https URL.' },
    { status: 400 }
  );
}

// Step 4: Use the sanitized, validated URL
await storeLink(sessionId, sanitizedUrl);
```

---

### Rate Limiting Implementation

#### Architecture

**Location:** `lib/rate-limiter.ts`

```typescript
interface RateLimitEntry {
  count: number;      // Number of requests made
  resetAt: number;    // When the window resets (Unix timestamp)
}

const rateLimitStore = new Map<string, RateLimitEntry>();
```

#### Core Function

```typescript
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000  // 1 minute default
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or expired window → Allow and create new entry
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  // Exceeded limit → Deny
  if (entry.count >= maxRequests) {
    return false;
  }

  // Within limit → Allow and increment
  entry.count++;
  return true;
}
```

#### Rate Limit Configurations

**1. Session Creation:**
```typescript
// In /api/session/route.ts
const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

if (!checkRateLimit(`session-${ip}`, 10, 60000)) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429 }
  );
}
```
- **Limit:** 10 sessions per minute
- **Identifier:** IP address
- **Reason:** Prevents session flooding attacks

**2. Link Submission:**
```typescript
// In /api/submit/[sessionId]/route.ts
if (!checkRateLimit(`submit-${sessionId}`, 5, 60000)) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429 }
  );
}
```
- **Limit:** 5 submissions per minute
- **Identifier:** Session ID
- **Reason:** Prevents spam submissions to same session

#### Automatic Cleanup

```typescript
export function cleanupRateLimits(): void {
  const now = Date.now();
  
  for (const [identifier, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(identifier);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
```

**Why periodic cleanup?**
- Prevents memory leaks
- Removes expired entries
- Keeps Map size manageable

#### Rate Limit Response

**HTTP 429 Too Many Requests:**
```json
{
  "error": "Too many requests. Please try again later."
}
```

**Client handling:**
```typescript
if (response.status === 429) {
  setError('Too many requests. Please try again later.');
}
```

---

### Session Security

#### UUID Generation

```typescript
import { randomUUID } from 'crypto';

export function generateSessionId(): string {
  return randomUUID();
}
```

**Properties:**
- Uses cryptographically secure random generator
- 128-bit random number
- Format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Practically impossible to guess (2^122 possible values)

**Example:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

#### Time-Limited Sessions

```typescript
export function getSessionExpiration(): number {
  return Date.now() + (5 * 60 * 1000); // 5 minutes
}
```

**Security benefits:**
1. **Limited exposure window:** Only 5 minutes to use a session
2. **Auto-cleanup:** Sessions self-destruct
3. **Reduces attack surface:** Old sessions can't be reused

#### Session Validation

```typescript
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
```

**Validation steps:**
1. Check if session exists
2. Check if session has expired
3. Auto-delete expired sessions
4. Return null for invalid sessions

---

## Storage Strategy

### In-Memory Storage

#### Current Implementation

**Location:** `lib/storage.ts`

```typescript
// Global storage that persists across HMR
const globalForStorage = globalThis as unknown as {
  memoryStore: Map<string, SessionData> | undefined;
};

const memoryStore = 
  globalForStorage.memoryStore ?? 
  new Map<string, SessionData>();

if (process.env.NODE_ENV !== 'production') {
  globalForStorage.memoryStore = memoryStore;
}
```

#### Data Structure

```typescript
Map<SessionId, SessionData>

Example:
{
  "uuid-1": {
    createdAt: 1705176000000,
    expiresAt: 1705176300000,
    link: "https://github.com"
  },
  "uuid-2": {
    createdAt: 1705176010000,
    expiresAt: 1705176310000,
    link: undefined
  }
}
```

#### Advantages

✅ **Simplicity:** No database setup required
✅ **Speed:** O(1) lookups, instant access
✅ **Cost:** Zero infrastructure cost
✅ **Development:** Persists across HMR
✅ **Sufficient:** Works for moderate traffic

#### Limitations

❌ **Not persistent:** Data lost on serverless restart
❌ **Single instance:** Each serverless instance has own memory
❌ **Scalability:** Limited by single instance memory
❌ **No redundancy:** No backup if instance crashes

#### When In-Memory Works

**Good for:**
- Personal projects
- Internal tools
- Low-to-moderate traffic (< 1000 concurrent sessions)
- Development and testing
- Proof of concepts

**Not suitable for:**
- High-traffic production apps
- Multi-region deployments
- Long-lived sessions
- Critical data that must persist

### Vercel Edge Config (Production Alternative)

#### Why Edge Config?

**Location:** Vercel's global edge network

**Advantages:**
✅ **Persistent:** Data survives serverless restarts
✅ **Global:** Shared across all serverless instances
✅ **Fast:** < 10ms read latency worldwide
✅ **Scalable:** Handles high traffic
✅ **Reliable:** Built-in redundancy

#### Migration Path

**1. Install SDK:**
```bash
npm install @vercel/edge-config
```

**2. Create Edge Config in Vercel Dashboard:**
```
Dashboard → Storage → Edge Config → Create
```

**3. Update storage.ts:**
```typescript
import { get, set } from '@vercel/edge-config';

export async function createSession(sessionId: string, expiresAt: number) {
  await set(sessionId, {
    createdAt: Date.now(),
    expiresAt,
  });
}

export async function getSession(sessionId: string) {
  const session = await get(sessionId);
  
  if (!session) return null;
  
  if (Date.now() > session.expiresAt) {
    await del(sessionId);
    return null;
  }
  
  return session;
}

export async function storeLink(sessionId: string, link: string) {
  const session = await get(sessionId);
  
  if (!session || Date.now() > session.expiresAt) {
    return false;
  }
  
  await set(sessionId, { ...session, link });
  return true;
}
```

**4. Add Environment Variable:**
```env
EDGE_CONFIG=https://edge-config.vercel.com/...
```

**5. Redeploy:**
```bash
vercel --prod
```

#### Cost Considerations

**Vercel Edge Config Limits:**
- Free tier: 1 config, 100 KB storage, 100,000 reads/month
- Pro tier: Unlimited configs, 512 KB storage, 1M reads/month

**Our usage:**
- Each session: ~200 bytes
- Free tier: ~500 concurrent sessions
- Reads: ~2 per second per session (SSE polling)

---

## Error Handling

### Client-Side Error Handling

#### PC Landing Page Errors

**1. Session Creation Failure:**
```typescript
try {
  const response = await fetch('/api/session', { method: 'POST' });
  if (!response.ok) {
    throw new Error('Failed to create session');
  }
  const data = await response.json();
  setSession(data);
} catch (err) {
  console.error('Error creating session:', err);
  setError('Failed to create session. Please try again.');
  setState('error');
}
```

**UI Display:**
```tsx
<div className="bg-red-100 rounded-full">
  <svg className="text-red-600">❌</svg>
  <h2>Error</h2>
  <p>{error}</p>
  <button onClick={createNewSession}>Try Again</button>
</div>
```

**2. SSE Connection Errors:**
```typescript
es.onerror = (err) => {
  console.error('SSE connection error:', err);
  setError('Connection lost. Please generate a new code.');
  setState('error');
  es.close();
};
```

**3. Session Timeout:**
```typescript
case 'timeout':
  setError('Session expired. Please generate a new code.');
  setState('error');
  es.close();
  break;
```

#### Mobile Submit Page Errors

**1. Network Errors:**
```typescript
try {
  const response = await fetch(`/api/submit/${sessionId}`, {
    method: 'POST',
    body: JSON.stringify({ link }),
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to send link');
  }
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to send link');
  setState('error');
}
```

**2. Validation Errors:**
```typescript
if (!link.trim()) {
  setError('Please enter a link');
  return;
}
```

**UI Display:**
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-800 text-sm">{error}</p>
  </div>
)}
```

### Server-Side Error Handling

#### Try-Catch Blocks

**Pattern used in all API routes:**
```typescript
export async function POST(request: Request) {
  try {
    // Main logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid input (URL, missing fields) |
| 404 | Not Found | Session doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

#### Error Messages

**Generic errors (prevent info leakage):**
```typescript
// ❌ Don't do this:
throw new Error(`Session ${sessionId} not found in database table sessions`);

// ✅ Do this:
return NextResponse.json(
  { error: 'Session not found or expired' },
  { status: 404 }
);
```

### SSE Error Handling

#### Server-Side

```typescript
const poll = async () => {
  try {
    // Polling logic
  } catch (error) {
    console.error('Error polling session:', error);
    sendMessage({ type: 'error', message: 'Internal server error' });
    controller.close();
  }
};
```

#### Client-Side

```typescript
es.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    // Handle message
  } catch (err) {
    console.error('Error parsing SSE message:', err);
    // Don't crash, just log
  }
};
```

### Graceful Degradation

**Network offline:**
```typescript
window.addEventListener('offline', () => {
  setError('No internet connection. Please check your network.');
  setState('error');
});

window.addEventListener('online', () => {
  createNewSession(); // Retry
});
```

**Cleanup on unmount:**
```typescript
useEffect(() => {
  createNewSession();

  return () => {
    if (eventSource) {
      eventSource.close(); // Prevent memory leaks
    }
  };
}, []);
```

---

