# Technical Deep Dive - QR Link Share

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Flow & Communication](#data-flow--communication)
3. [Session Management](#session-management)
4. [Server-Sent Events (SSE)](#server-sent-events-sse)
5. [API Routes Implementation](#api-routes-implementation)
6. [Frontend Components](#frontend-components)
7. [Security & Rate Limiting](#security--rate-limiting)
8. [Storage Strategy](#storage-strategy)
9. [Error Handling](#error-handling)
10. [Performance Optimizations](#performance-optimizations)

---

## System Architecture

### Overview

The QR Link Share application follows a modern serverless architecture using Next.js 14 App Router:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│  PC Browser (/)          │    Mobile Browser (/submit/[id]) │
│  - QR Code Display       │    - URL Input Form              │
│  - SSE Connection        │    - Submission Handler          │
│  - Auto-open Links       │    - Success/Error States        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Server                           │
├─────────────────────────────────────────────────────────────┤
│  API Routes:                                                 │
│  - POST /api/session        → Create new session            │
│  - POST /api/submit/[id]    → Submit link to session        │
│  - GET  /api/listen/[id]    → SSE stream for updates        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Storage Layer                            │
├─────────────────────────────────────────────────────────────┤
│  In-Memory Store (Development/Production)                    │
│  - Session data: { sessionId, expiresAt, link? }            │
│  - Rate limit tracking                                       │
│  - Automatic cleanup via setTimeout                          │
│                                                              │
│  Optional: Vercel Edge Config (Production Scale)             │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18.3.0 - UI components and state management
- Next.js 14.2.0 - Server-side rendering and routing
- TailwindCSS 3.4.0 - Utility-first styling
- qrcode.react 3.1.0 - QR code generation

**Backend:**
- Next.js API Routes - Serverless functions
- Server-Sent Events - Real-time communication
- In-memory storage - Session data persistence

**Infrastructure:**
- Vercel - Serverless deployment platform
- Edge Network - Global CDN distribution
- Automatic HTTPS - SSL/TLS encryption

---

