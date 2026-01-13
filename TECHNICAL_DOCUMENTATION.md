# QR Link Share - Complete Technical Documentation

## 📚 Documentation Index

This comprehensive technical documentation is split into multiple parts for easier navigation. Each part covers specific aspects of the QR Link Share application in detail.

---

## Table of Contents

### Part 1: Foundation & Architecture
📄 **[TECHNICAL_DEEP_DIVE.md](./TECHNICAL_DEEP_DIVE.md)**
- System Architecture Overview
- Technology Stack Details
- Component Hierarchy
- Infrastructure Setup

### Part 2: Data Flow & Session Management
📄 **[TECHNICAL_DEEP_DIVE_PART2.md](./TECHNICAL_DEEP_DIVE_PART2.md)**
- Complete Request Flow Diagrams
- Sequence Diagrams
- Session Lifecycle Explained
- Persistent Storage Across HMR
- Server-Sent Events Deep Dive
- SSE Implementation (Client & Server)

### Part 3: API & Frontend Components
📄 **[TECHNICAL_DEEP_DIVE_PART3.md](./TECHNICAL_DEEP_DIVE_PART3.md)**
- API Routes Implementation
  - POST /api/session
  - POST /api/submit/[sessionId]
  - GET /api/listen/[sessionId]
- PC Landing Page Component
- Mobile Submit Page Component
- State Management Patterns
- QR Code Generation

### Part 4: Security & Storage
📄 **[TECHNICAL_DEEP_DIVE_PART4.md](./TECHNICAL_DEEP_DIVE_PART4.md)**
- URL Validation & Sanitization
- Rate Limiting Implementation
- Session Security
- In-Memory Storage Strategy
- Vercel Edge Config Migration
- Client & Server Error Handling

### Part 5: Performance & Deployment
📄 **[TECHNICAL_DEEP_DIVE_PART5.md](./TECHNICAL_DEEP_DIVE_PART5.md)**
- Frontend Optimizations
- Backend Optimizations
- Network Optimizations
- Performance Metrics
- Vercel Serverless Functions
- Multi-Region Architecture
- Monitoring & Debugging
- Testing Strategies

### Part 6: Advanced Topics & Troubleshooting
📄 **[TECHNICAL_DEEP_DIVE_PART6.md](./TECHNICAL_DEEP_DIVE_PART6.md)**
- Scaling Considerations
- Security Hardening (CSP, CORS)
- Observability & Logging
- Browser Compatibility
- Mobile Optimizations
- Common Issues & Solutions
- Future Enhancements

---

## Quick Reference

### Architecture Diagram

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
└─────────────────────────────────────────────────────────────┘
```

### Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Next.js 14.2+ | Server-side rendering, API routes |
| Language | TypeScript 5.0+ | Type safety |
| Styling | TailwindCSS 3.4+ | Utility-first CSS |
| QR Codes | qrcode.react 3.1+ | QR code generation |
| Real-time | Server-Sent Events | Push updates |
| Deployment | Vercel | Serverless hosting |
| Storage | In-Memory / Edge Config | Session management |

### Project Structure

```
qr-link-share/
├── app/
│   ├── api/
│   │   ├── session/route.ts          # Session creation
│   │   ├── submit/[sessionId]/       # Link submission
│   │   └── listen/[sessionId]/       # SSE endpoint
│   ├── submit/[sessionId]/page.tsx   # Mobile submit page
│   ├── page.tsx                      # PC landing page
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
├── lib/
│   ├── utils.ts                      # Utilities
│   ├── storage.ts                    # Session storage
│   └── rate-limiter.ts               # Rate limiting
└── Documentation/
    ├── README.md
    ├── TECHNICAL_DOCUMENTATION.md     # This file
    ├── TECHNICAL_DEEP_DIVE.md         # Part 1
    ├── TECHNICAL_DEEP_DIVE_PART2.md   # Part 2
    ├── TECHNICAL_DEEP_DIVE_PART3.md   # Part 3
    ├── TECHNICAL_DEEP_DIVE_PART4.md   # Part 4
    ├── TECHNICAL_DEEP_DIVE_PART5.md   # Part 5
    └── TECHNICAL_DEEP_DIVE_PART6.md   # Part 6
```

### Performance Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Time to First Byte (TTFB) | ~200ms | < 300ms |
| First Contentful Paint (FCP) | ~800ms | < 1s |
| Largest Contentful Paint (LCP) | ~1.2s | < 2.5s |
| Session Creation | 30-50ms | < 100ms |
| Link Submission | 40-70ms | < 100ms |
| SSE Latency | 500-1500ms | < 2s |

### Security Features

✅ **URL Validation** - HTTP/HTTPS only  
✅ **Protocol Filtering** - Blocks javascript:, data:, vbscript:  
✅ **Rate Limiting** - 10 sessions/min, 5 submissions/min  
✅ **Session Expiration** - Auto-expires after 5 minutes  
✅ **Input Sanitization** - All user inputs sanitized  
✅ **HTTPS Only** - Enforced by Vercel  
✅ **UUID Sessions** - Cryptographically random IDs  

---

## Live Application

**Production URL:** https://ls.u4ia.site  
**GitHub Repository:** https://github.com/DebadityaHait/lshr  
**Vercel Dashboard:** https://vercel.com/debadityahaits-projects/ls

---

## How to Use This Documentation

### For Developers New to the Project

1. Start with **Part 1** for architecture overview
2. Read **Part 2** to understand data flow
3. Review **Part 3** for API and component details
4. Study **Part 4** for security and storage
5. Check **Part 5** for performance and deployment
6. Reference **Part 6** for advanced topics

### For Troubleshooting

Jump directly to **Part 6** → Common Issues & Solutions

### For Security Review

Focus on **Part 4** → Security & Rate Limiting

### For Performance Optimization

See **Part 5** → Performance Optimizations

### For Scaling Decisions

Read **Part 6** → Scaling Considerations

---

## Additional Documentation

- **[README.md](./README.md)** - User guide and quick start
- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment instructions
- **[FEATURES.md](./FEATURES.md)** - Feature documentation
- **[PROJECT_COMPLETE.md](./PROJECT_COMPLETE.md)** - Project completion summary
- **[YOUR_DEPLOYMENT_INFO.md](./YOUR_DEPLOYMENT_INFO.md)** - Your deployment details

---

## Contributing

When adding new features or making changes:

1. Update relevant technical documentation part
2. Add tests if applicable
3. Update performance metrics if changed
4. Document security implications
5. Update this index if needed

---

## Changelog

### Version 1.0.0 (January 13, 2026)

**Initial Release:**
- Complete QR Link Share application
- Full technical documentation (6 parts)
- Production deployment on Vercel
- Custom domain configuration
- GitHub repository published

**Features:**
- Session-based link sharing
- QR code generation
- Server-Sent Events for real-time updates
- Rate limiting and security
- Mobile-responsive design
- 5-minute session expiration

**Performance:**
- Lighthouse score: 95-100
- Load time: < 1.2s
- API latency: < 100ms
- SSE delivery: < 1.5s

---

## Contact & Support

**Developer:** Debaditya Hait  
**Repository:** https://github.com/DebadityaHait/lshr  
**Live App:** https://ls.u4ia.site  

For issues, questions, or contributions:
- Open an issue on GitHub
- Review documentation parts above
- Check Vercel deployment logs

---

## License

MIT License - See LICENSE file for details

---

**Last Updated:** January 13, 2026  
**Documentation Version:** 1.0.0  
**Application Version:** 1.0.0

---

*This is the master index for all technical documentation. Each part is self-contained but references other parts where relevant. Together, they provide a complete understanding of the QR Link Share application.*
