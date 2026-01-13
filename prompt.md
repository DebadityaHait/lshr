**Project: QR Code Link Sharing - Mobile to PC**

Build a web application using Next.js 14+ (App Router) that enables users to share links from mobile devices to their PC through QR code scanning. Deploy on Vercel's free tier using only Vercel services.

**Tech Stack:**

- Next.js 14+ with App Router
- TypeScript
- Vercel Edge Config for session storage
- Server-Sent Events (SSE) for real-time updates
- TailwindCSS for styling
- QR code generation library (qrcode.react or similar)

**Core Functionality:**

1. **PC Landing Page** (`/`):
   - Generate unique session ID on page load
   - Display QR code containing URL: `https://[domain]/submit/[sessionId]`
   - Show "Waiting for link..." status
   - Establish SSE connection to `/api/listen/[sessionId]` endpoint
   - When link received via SSE, automatically open in new tab and show success message
   - Add "Generate New Code" button to create fresh session
2. **Mobile Submit Page** (`/submit/[sessionId]`):
   - Clean, mobile-optimized interface
   - Text input field for pasting/entering URL
   - URL validation (ensure it's a valid link)
   - "Send to PC" button
   - Success confirmation after sending
   - Error handling for expired/invalid sessions
3. **API Routes:**
   - `POST /api/session` - Create new session in Edge Config (auto-expire after 5 minutes)
   - `POST /api/submit/[sessionId]` - Store link in Edge Config with session ID
   - `GET /api/listen/[sessionId]` - SSE endpoint that polls Edge Config and streams link when available

**Technical Requirements:**

- Use Vercel Edge Config SDK for all data operations
- Implement session expiration (5-10 minutes)
- Use Server-Sent Events with proper headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`)
- Clean up sessions after successful link transfer
- Add rate limiting to prevent abuse
- Mobile-responsive design
- No authentication required
- Include loading states and error boundaries

**Security:**

- Validate all URLs before storing
- Implement session uniqueness (UUIDs)
- Add basic rate limiting on API routes
- Auto-expire old sessions
- Sanitize inputs

**UI/UX:**

- Minimal, clean design
- Large QR code on PC view (easily scannable)
- Clear instructions on both PC and mobile views
- Visual feedback during all states (waiting, sending, success)
- Error messages for failed operations

Deploy as a single Next.js project on Vercel. Configure Edge Config through Vercel dashboard. Ensure all functionality works within Vercel's free tier limits.