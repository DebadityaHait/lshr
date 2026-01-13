# Quick Start Guide

Get your QR Link Share application up and running in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- npm or yarn

Check your Node version:
```bash
node --version
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- qrcode.react
- And all necessary dependencies

### 2. Verify Environment Variables

The `.env.local` file is already created with default values:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

No changes needed for local development!

### 3. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### 4. Test the Application

**On Your Computer:**
1. Open `http://localhost:3000` in your browser
2. You'll see a QR code displayed on the screen

**On Your Mobile Device:**
1. Connect to the same network as your computer
2. Open your phone's camera app
3. Scan the QR code
4. Enter a URL (e.g., `https://github.com`)
5. Click "Send to PC"
6. Watch the link open automatically on your computer!

## That's It! 🎉

You now have a fully functional QR Link Share application running locally.

## Next Steps

### Test Different Scenarios

1. **Valid URL**: `https://www.example.com`
2. **Invalid URL**: `not-a-url` (should show error)
3. **Multiple Links**: Send several links in succession
4. **Session Expiration**: Wait 5 minutes and try to submit (should fail)
5. **New Session**: Click "Generate New Code" to create a fresh session

### Deploy to Production

When you're ready to deploy:

```bash
npm run build
npm start
```

Or deploy to Vercel:
```bash
npm install -g vercel
vercel
```

See `DEPLOYMENT.md` for detailed deployment instructions.

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can specify a different port:
```bash
npm run dev -- -p 3001
```

Then update `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Mobile Can't Access localhost

If your mobile device can't access `localhost:3000`, use your computer's IP address:

1. Find your computer's local IP:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr`

2. Update `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=http://192.168.1.X:3000
   ```
   (Replace X with your actual IP)

3. Restart the dev server

### QR Code Not Scanning

- Ensure adequate lighting
- Hold phone steady
- Try zooming the QR code on screen
- Some camera apps require tapping the notification to follow the link

## Development Tips

### Hot Reload

The app supports hot reload. Make changes to any file and see them instantly without refreshing!

### View Logs

All server logs appear in your terminal where you ran `npm run dev`.

### Browser DevTools

Open browser console (F12) to see:
- Client-side logs
- SSE connection status
- Network requests
- React component tree

## Project Structure Overview

```
qr-link-share/
├── app/
│   ├── api/              # API routes
│   ├── submit/           # Mobile submit page
│   ├── page.tsx          # PC landing page
│   └── layout.tsx        # Root layout
├── lib/
│   ├── utils.ts          # Helper functions
│   ├── storage.ts        # Session management
│   └── rate-limiter.ts   # Rate limiting
├── package.json          # Dependencies
└── .env.local            # Environment variables
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Deployment
vercel                   # Deploy to Vercel
vercel --prod            # Deploy to production
```

## Getting Help

- 📖 Read `README.md` for full documentation
- 🚀 Check `DEPLOYMENT.md` for deployment guides
- ✨ See `FEATURES.md` for feature details
- 💬 Open an issue on GitHub

## Success Checklist

- ✅ Dependencies installed (`npm install`)
- ✅ Dev server running (`npm run dev`)
- ✅ PC page loads (http://localhost:3000)
- ✅ QR code displays on PC
- ✅ Mobile can scan QR code
- ✅ Link submission works
- ✅ Link opens automatically on PC

If all checkboxes are ticked, you're good to go! 🚀
