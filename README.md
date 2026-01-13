# QR Link Share - Mobile to PC

A Next.js 14 web application that enables users to share links from mobile devices to their PC through QR code scanning. Built with TypeScript, TailwindCSS, and Server-Sent Events for real-time updates.

## Features

- 🔗 Share links from mobile to PC instantly
- 📱 Mobile-optimized submit interface
- 💻 Clean PC interface with QR code display
- ⚡ Real-time updates using Server-Sent Events (SSE)
- 🔒 Secure with session expiration (5 minutes)
- 🚀 Deployed on Vercel's free tier
- ✨ No authentication required

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **QR Codes**: qrcode.react
- **Real-time**: Server-Sent Events (SSE)
- **Storage**: In-memory (with Vercel Edge Config ready)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd qr-link-share
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your configuration:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
# EDGE_CONFIG=your_edge_config_connection_string (optional for production)
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### On PC:
1. Open the application in your browser
2. A QR code will be generated automatically
3. Wait for a link to be sent from your mobile device
4. When received, the link will open automatically in a new tab

### On Mobile:
1. Scan the QR code displayed on the PC
2. Enter or paste the URL you want to send
3. Click "Send to PC"
4. The link will be sent and opened on your PC

## Deployment on Vercel

### Deploy with Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to deploy your application.

### Deploy with Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import your repository
5. Configure environment variables:
   - `NEXT_PUBLIC_APP_URL`: Your production URL (e.g., `https://your-app.vercel.app`)
6. Click "Deploy"

### Optional: Enable Vercel Edge Config (Production)

For production use with persistent storage:

1. In Vercel Dashboard, go to your project
2. Navigate to "Storage" tab
3. Create a new Edge Config store
4. Copy the connection string
5. Add it as an environment variable: `EDGE_CONFIG=<your-connection-string>`
6. Update `lib/storage.ts` to use Edge Config API

**Note**: The current implementation uses in-memory storage which works well for the free tier but sessions won't persist across serverless function instances. For production with high traffic, consider implementing Edge Config or another persistent storage solution.

## Project Structure

```
qr-link-share/
├── app/
│   ├── api/
│   │   ├── session/
│   │   │   └── route.ts          # Create new session
│   │   ├── submit/[sessionId]/
│   │   │   └── route.ts          # Submit link
│   │   └── listen/[sessionId]/
│   │       └── route.ts          # SSE endpoint
│   ├── submit/[sessionId]/
│   │   └── page.tsx              # Mobile submit page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # PC landing page
│   └── globals.css               # Global styles
├── lib/
│   ├── utils.ts                  # Utility functions
│   ├── storage.ts                # Session storage
│   └── rate-limiter.ts           # Rate limiting
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## API Routes

### POST /api/session
Creates a new session with unique ID and expiration time.

**Response:**
```json
{
  "sessionId": "uuid-here",
  "expiresAt": 1234567890,
  "url": "https://your-app.vercel.app/submit/uuid-here"
}
```

### POST /api/submit/[sessionId]
Submits a link to an existing session.

**Request Body:**
```json
{
  "link": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Link sent successfully"
}
```

### GET /api/listen/[sessionId]
Server-Sent Events endpoint that streams updates when a link is submitted.

**SSE Events:**
- `connected`: Connection established
- `link`: Link received (includes the URL)
- `timeout`: Session expired
- `error`: Error occurred

## Security Features

- ✅ URL validation and sanitization
- ✅ Session uniqueness using UUIDs
- ✅ Rate limiting on API routes
- ✅ Auto-expiring sessions (5 minutes)
- ✅ Input sanitization
- ✅ Prevention of dangerous URL protocols (javascript:, data:, vbscript:)

## Rate Limits

- Session creation: 10 per minute per IP
- Link submission: 5 per minute per session

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with camera for QR scanning

## Troubleshooting

### QR Code not generating
- Check that `NEXT_PUBLIC_APP_URL` is set correctly in your environment variables
- Clear browser cache and reload

### Link not received on PC
- Ensure both devices are connected to the internet
- Check browser console for errors
- Verify the session hasn't expired (5 minute limit)

### SSE connection issues
- Some corporate networks may block SSE connections
- Try using a different network or VPN
- Check browser console for connection errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- QR codes powered by [qrcode.react](https://www.npmjs.com/package/qrcode.react)
- Deployed on [Vercel](https://vercel.com)
