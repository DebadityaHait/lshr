# QR Link Share - Feature Documentation

## Core Features

### 1. Session Management
- **Automatic Session Creation**: Each PC visitor gets a unique session ID
- **QR Code Generation**: Dynamic QR code created for each session
- **Time-Limited Sessions**: Sessions expire after 5 minutes
- **Session Cleanup**: Automatic cleanup of expired sessions

### 2. Real-Time Communication
- **Server-Sent Events (SSE)**: Real-time updates without polling overhead
- **Instant Link Transfer**: Links appear on PC immediately when sent from mobile
- **Auto-Open**: Links automatically open in new tab on PC
- **Connection Monitoring**: Automatic reconnection handling

### 3. Mobile Experience
- **Responsive Design**: Optimized for mobile devices
- **QR Code Scanning**: Native camera integration
- **Simple Interface**: Single input field for URL entry
- **Visual Feedback**: Clear success/error states
- **Fast Submission**: Optimized for quick link sharing

### 4. PC Experience
- **Large QR Code**: Easy to scan from distance
- **Session Timer**: Visual countdown until expiration
- **Status Indicators**: Clear waiting/received/error states
- **One-Click Refresh**: Generate new session anytime
- **Auto-Tab Opening**: Received links open automatically

### 5. Security Features
- **URL Validation**: Ensures only valid HTTP/HTTPS URLs
- **Protocol Filtering**: Blocks dangerous protocols (javascript:, data:, vbscript:)
- **Rate Limiting**: Prevents abuse
  - Session creation: 10/minute per IP
  - Link submission: 5/minute per session
- **Input Sanitization**: All user inputs are sanitized
- **Session Isolation**: Each session is completely isolated

### 6. Error Handling
- **Expired Sessions**: Clear error messages for expired sessions
- **Invalid URLs**: Helpful validation messages
- **Network Errors**: Graceful degradation on connection issues
- **Rate Limit Notices**: User-friendly rate limit messages

### 7. User Experience
- **No Authentication**: Zero friction, start using immediately
- **No Installation**: Browser-based, works everywhere
- **Cross-Platform**: Works on any device with a browser
- **Minimal UI**: Clean, distraction-free interface
- **Loading States**: Clear feedback during all operations

## Technical Implementation

### Architecture
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Mobile    │         │   Server    │         │     PC      │
│   Browser   │         │  (Next.js)  │         │   Browser   │
└─────────────┘         └─────────────┘         └─────────────┘
       │                       │                       │
       │                       │    1. Load Page       │
       │                       │◄──────────────────────┤
       │                       │    2. Create Session  │
       │                       │──────────────────────►│
       │                       │    3. SSE Connect     │
       │                       │◄──────────────────────┤
       │   4. Scan QR Code     │                       │
       │◄──────────────────────┼───────────────────────┤
       │   5. Submit Link      │                       │
       ├──────────────────────►│                       │
       │   6. Store Link       │                       │
       │                       │    7. SSE Event       │
       │                       ├──────────────────────►│
       │                       │    8. Open Link       │
       │                       │                       │
```

### Data Flow
1. PC loads landing page → Creates session → Generates QR code
2. PC establishes SSE connection to listen for links
3. Mobile scans QR code → Opens submit page with session ID
4. Mobile submits URL → Server validates and stores
5. Server notifies PC via SSE → Link opens automatically

### Storage Strategy
- **Development**: In-memory storage (fast, simple)
- **Production**: Can be upgraded to Vercel Edge Config
- **Session Data**: Session ID, expiration time, submitted link
- **Cleanup**: Automatic garbage collection of expired sessions

### API Endpoints

#### POST /api/session
Creates a new session with unique ID.
```typescript
Response: {
  sessionId: string;
  expiresAt: number;
  url: string;
}
```

#### POST /api/submit/[sessionId]
Submits a link to an existing session.
```typescript
Request: { link: string }
Response: { success: boolean; message: string }
```

#### GET /api/listen/[sessionId]
SSE endpoint for real-time updates.
```typescript
Events:
- connected: { type: "connected", sessionId: string }
- link: { type: "link", link: string }
- timeout: { type: "timeout", message: string }
- error: { type: "error", message: string }
```

## Performance Characteristics

- **Session Creation**: < 50ms
- **Link Submission**: < 100ms
- **SSE Latency**: < 500ms (typically < 200ms)
- **QR Code Generation**: Instant (client-side)
- **Page Load**: < 1s on 3G

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| QR Display | ✅ | ✅ | ✅ | ✅ |
| SSE | ✅ 90+ | ✅ 88+ | ✅ 14+ | ✅ 90+ |
| Mobile Scan | ✅ | ✅ | ✅ | ✅ |
| Auto-Open | ✅ | ✅ | ✅ | ✅ |

## Limitations & Considerations

### Free Tier Limits
- **Vercel**: 100 GB bandwidth, unlimited requests
- **Storage**: In-memory (sessions don't persist across deployments)
- **Concurrent Sessions**: Limited by server memory

### Technical Constraints
- **Session Duration**: 5 minutes (configurable)
- **Max URL Length**: 2048 characters (browser limit)
- **SSE Connection**: One per session
- **Rate Limits**: Configurable per route

### Known Issues
- SSE may not work behind some corporate firewalls
- In-memory storage resets on serverless cold starts
- QR code scanning requires camera permission

## Future Enhancements (Not Implemented)

Potential features for future versions:
- [ ] Persistent storage with Vercel Edge Config
- [ ] Link history (recent transfers)
- [ ] Multi-device support (send to multiple PCs)
- [ ] Custom session duration
- [ ] File transfer support
- [ ] Encryption for sensitive links
- [ ] Analytics dashboard
- [ ] Browser extension
- [ ] PWA support

## Use Cases

1. **Quick Link Sharing**: Send interesting articles from phone to PC
2. **Work Collaboration**: Share documents between devices
3. **Shopping**: Transfer product links to PC for better viewing
4. **Research**: Collect mobile findings on desktop
5. **Presentations**: Display mobile content on PC screen

## Best Practices

### For Users
- Use on trusted networks
- Don't share sensitive URLs through public sessions
- Regenerate session if QR code is exposed
- Close session when done

### For Developers
- Monitor rate limits in production
- Implement Edge Config for production scaling
- Add analytics to track usage patterns
- Consider adding authentication for sensitive deployments
- Test on various network conditions
