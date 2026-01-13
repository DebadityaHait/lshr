# Technical Deep Dive - Part 3

## API Routes Implementation

### POST /api/session - Session Creation

**Location:** `app/api/session/route.ts`

#### Purpose
Creates a new session with unique ID and expiration time. This is called when a PC browser loads the landing page.

#### Implementation

```typescript
export async function POST(request: Request) {
  try {
    // 1. Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    // 2. Rate limiting: 10 sessions per minute per IP
    if (!checkRateLimit(`session-${ip}`, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // 3. Generate unique session ID
    const sessionId = generateSessionId(); // Uses crypto.randomUUID()
    
    // 4. Calculate expiration (5 minutes from now)
    const expiresAt = getSessionExpiration(); // Date.now() + 5*60*1000
    
    // 5. Store session in memory
    await createSession(sessionId, expiresAt);
    
    // 6. Return session data
    return NextResponse.json({
      sessionId,
      expiresAt,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/submit/${sessionId}`,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
```

#### Request/Response

**Request:**
```http
POST /api/session HTTP/1.1
Host: ls.u4ia.site
```

**Response (Success):**
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "expiresAt": 1705176300000,
  "url": "https://ls.u4ia.site/submit/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response (Rate Limited):**
```json
{
  "error": "Too many requests. Please try again later."
}
```

#### Security Measures

1. **Rate Limiting:** Prevents DOS attacks (max 10 sessions/min per IP)
2. **UUID Generation:** Cryptographically random, prevents guessing
3. **Time-Limited:** Sessions auto-expire after 5 minutes
4. **Error Handling:** Generic error messages to prevent info leakage

---

### POST /api/submit/[sessionId] - Link Submission

**Location:** `app/api/submit/[sessionId]/route.ts`

#### Purpose
Accepts a URL from mobile device and stores it in the session for the PC to receive.

#### Implementation

```typescript
export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    
    // 1. Rate limiting: 5 submissions per minute per session
    if (!checkRateLimit(`submit-${sessionId}`, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { link } = body;

    // 3. Validate link exists and is string
    if (!link || typeof link !== 'string') {
      return NextResponse.json(
        { error: 'Link is required' },
        { status: 400 }
      );
    }

    // 4. Sanitize URL (prevent XSS)
    let sanitizedUrl: string;
    try {
      sanitizedUrl = sanitizeUrl(link);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL protocol' },
        { status: 400 }
      );
    }

    // 5. Validate URL format
    if (!isValidUrl(sanitizedUrl)) {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a valid http or https URL.' },
        { status: 400 }
      );
    }

    // 6. Check if session exists and is valid
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // 7. Store the link in the session
    const success = await storeLink(sessionId, sanitizedUrl);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to store link. Session may have expired.' },
        { status: 500 }
      );
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      message: 'Link sent successfully',
    });
  } catch (error) {
    console.error('Error submitting link:', error);
    return NextResponse.json(
      { error: 'Failed to submit link' },
      { status: 500 }
    );
  }
}
```

#### Request/Response

**Request:**
```http
POST /api/submit/a1b2c3d4-e5f6-7890-abcd-ef1234567890 HTTP/1.1
Host: ls.u4ia.site
Content-Type: application/json

{
  "link": "https://github.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Link sent successfully"
}
```

**Response (Invalid URL):**
```json
{
  "error": "Invalid URL format. Please provide a valid http or https URL."
}
```

**Response (Session Not Found):**
```json
{
  "error": "Session not found or expired"
}
```

#### Validation Pipeline

```
Input URL
    │
    ├─► Type Check (must be string)
    │   └─► FAIL → 400 "Link is required"
    │
    ├─► Sanitization (remove dangerous protocols)
    │   └─► FAIL → 400 "Invalid URL protocol"
    │
    ├─► Format Validation (must be valid URL)
    │   └─► FAIL → 400 "Invalid URL format"
    │
    ├─► Session Check (must exist and not expired)
    │   └─► FAIL → 404 "Session not found"
    │
    └─► Store Link
        └─► SUCCESS → 200 "Link sent successfully"
```

---

### GET /api/listen/[sessionId] - SSE Stream

**Location:** `app/api/listen/[sessionId]/route.ts`

#### Purpose
Establishes a Server-Sent Events stream to notify the PC when a link is submitted.

#### Implementation Details

**1. Stream Creation:**
```typescript
const stream = new ReadableStream({
  async start(controller) {
    // Stream implementation
  },
  cancel() {
    // Cleanup on disconnect
  }
});
```

**2. Message Encoding:**
```typescript
const encoder = new TextEncoder();
const sendMessage = (data: Record<string, unknown>) => {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(message));
};
```

**3. Polling Logic:**
```typescript
const poll = async () => {
  // Check timeout
  if (Date.now() - startTime > maxDuration) {
    sendMessage({ type: 'timeout' });
    controller.close();
    return;
  }

  // Get session
  const session = await getSession(sessionId);
  
  if (!session) {
    // Handle missing session with grace period
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
};
```

#### Event Types

**1. Connected Event:**
```json
{"type": "connected", "sessionId": "abc-123"}
```
Sent immediately when SSE connection established.

**2. Link Event:**
```json
{"type": "link", "link": "https://github.com"}
```
Sent when mobile submits a link.

**3. Timeout Event:**
```json
{"type": "timeout", "message": "Session expired"}
```
Sent when session exceeds 5-minute limit.

**4. Error Event:**
```json
{"type": "error", "message": "Session not found or expired"}
```
Sent when session doesn't exist or other errors occur.

#### Response Headers

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

**Why these headers?**
- `text/event-stream`: Required for SSE
- `no-cache`: Prevents proxy caching
- `keep-alive`: Maintains persistent connection
- `X-Accel-Buffering: no`: Disables nginx buffering

#### Performance Characteristics

- **Poll Interval:** 1 second (configurable)
- **Max Duration:** 5 minutes
- **Latency:** Typically < 1 second from submit to receive
- **Memory:** Minimal (single connection per session)
- **CPU:** Low (simple polling, not event-driven)

---

## Frontend Components

### PC Landing Page (`app/page.tsx`)

#### Component Structure

```
HomePage
├─── State Management
│    ├─ session (SessionData | null)
│    ├─ state (SessionState)
│    ├─ receivedLink (string | null)
│    ├─ error (string | null)
│    └─ eventSource (EventSource | null)
│
├─── useEffect Hooks
│    ├─ Initial session creation
│    └─ Timer for countdown display
│
├─── Functions
│    ├─ createNewSession()
│    ├─ listenForLink()
│    └─ getTimeRemaining()
│
└─── Render Logic
     ├─ Loading State
     ├─ Ready/Waiting State (QR Code)
     ├─ Received State (Success)
     └─ Error State
```

#### State Management

```typescript
type SessionState = 'loading' | 'ready' | 'waiting' | 'received' | 'error';

interface SessionData {
  sessionId: string;
  url: string;
  expiresAt: number;
}

const [state, setState] = useState<SessionState>('loading');
const [session, setSession] = useState<SessionData | null>(null);
const [receivedLink, setReceivedLink] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
const [eventSource, setEventSource] = useState<EventSource | null>(null);
```

#### State Transitions

```
loading
   │
   ├─► ready (session created)
   │    │
   │    └─► waiting (SSE connected, waiting for link)
   │         │
   │         ├─► received (link arrived)
   │         └─► error (timeout/connection lost)
   │
   └─► error (failed to create session)
```

#### Key Functions

**1. createNewSession:**
```typescript
const createNewSession = async () => {
  try {
    setState('loading');
    setError(null);
    setReceivedLink(null);

    // Close existing EventSource
    if (eventSource) {
      eventSource.close();
    }

    // Create new session
    const response = await fetch('/api/session', { method: 'POST' });
    const data = await response.json();
    
    setSession(data);
    setState('ready');

    // Start listening for links
    listenForLink(data.sessionId);
  } catch (err) {
    setError('Failed to create session');
    setState('error');
  }
};
```

**2. listenForLink:**
```typescript
const listenForLink = (sessionId: string) => {
  setState('waiting');

  setTimeout(() => {
    const es = new EventSource(`/api/listen/${sessionId}`);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'link':
          setReceivedLink(data.link);
          setState('received');
          window.open(data.link, '_blank', 'noopener,noreferrer');
          es.close();
          break;
        
        case 'timeout':
        case 'error':
          setError(data.message);
          setState('error');
          es.close();
          break;
      }
    };

    es.onerror = () => {
      setError('Connection lost');
      setState('error');
      es.close();
    };

    setEventSource(es);
  }, 100); // Delay to avoid race condition
};
```

**3. getTimeRemaining:**
```typescript
const getTimeRemaining = () => {
  if (!session) return '';
  const remaining = Math.max(0, session.expiresAt - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
```

#### QR Code Generation

```typescript
<QRCodeSVG
  value={session.url}
  size={256}
  level="M"
  includeMargin={true}
/>
```

**Parameters:**
- `value`: The URL to encode (e.g., `https://ls.u4ia.site/submit/abc-123`)
- `size`: QR code dimensions in pixels
- `level`: Error correction level (L, M, Q, H - M is balanced)
- `includeMargin`: Adds white border around QR code

#### UI States

**Loading:**
```tsx
<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600">
</div>
```

**Waiting:**
```tsx
<div className="animate-pulse h-3 w-3 bg-indigo-600 rounded-full"></div>
<p>Waiting for link...</p>
```

**Success:**
```tsx
<div className="w-20 h-20 bg-green-100 rounded-full">
  <svg className="w-10 h-10 text-green-600">
    <path d="M5 13l4 4L19 7" /> {/* Checkmark */}
  </svg>
</div>
```

---

### Mobile Submit Page (`app/submit/[sessionId]/page.tsx`)

#### Component Structure

```
SubmitPage
├─── URL Parameter Extraction
│    └─ sessionId from params
│
├─── State Management
│    ├─ link (string)
│    ├─ state (SubmitState)
│    └─ error (string | null)
│
├─── Functions
│    ├─ handleSubmit()
│    └─ handleReset()
│
└─── Render Logic
     ├─ Form (idle/submitting/error)
     └─ Success Message
```

#### State Management

```typescript
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const [link, setLink] = useState('');
const [state, setState] = useState<SubmitState>('idle');
const [error, setError] = useState<string | null>(null);
```

#### Form Submission

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  if (!link.trim()) {
    setError('Please enter a link');
    return;
  }

  try {
    setState('submitting');
    setError(null);

    const response = await fetch(`/api/submit/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link: link.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send link');
    }

    setState('success');
    setLink('');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to send link');
    setState('error');
  }
};
```

#### Mobile UI Optimization

**Input Field:**
```tsx
<input
  type="text"
  autoFocus
  placeholder="https://example.com"
  className="w-full px-4 py-3 border rounded-lg text-gray-900"
/>
```

**Submit Button:**
```tsx
<button
  type="submit"
  disabled={state === 'submitting' || !link.trim()}
  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg"
>
  {state === 'submitting' ? 'Sending...' : 'Send to PC'}
</button>
```

**Success Animation:**
```tsx
<div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
  <svg className="w-10 h-10 text-green-600">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
</div>
```

---

