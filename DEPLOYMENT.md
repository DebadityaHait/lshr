# Deployment Guide

This guide will walk you through deploying the QR Link Share application to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier is sufficient)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- OR Vercel CLI installed (`npm install -g vercel`)

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Sign in with your GitHub/GitLab/Bitbucket account
3. Click "Import Project"
4. Select your repository from the list
5. Click "Import"

### Step 2: Configure Project

Vercel will automatically detect that this is a Next.js project.

**Environment Variables:**
Add the following environment variable:
- `NEXT_PUBLIC_APP_URL`: Your production URL (initially use `https://your-project.vercel.app`)

**Note**: After first deployment, update this URL with your actual Vercel URL.

### Step 3: Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 1-2 minutes)
3. Once deployed, click "Visit" to view your site

### Step 4: Update Environment Variable

1. After deployment, note your actual URL (e.g., `https://qr-link-share-abc123.vercel.app`)
2. Go to Project Settings → Environment Variables
3. Update `NEXT_PUBLIC_APP_URL` with your actual URL
4. Redeploy for changes to take effect

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

From your project directory:

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time)
- What's your project's name? **qr-link-share** (or your preferred name)
- In which directory is your code located? **./**
- Want to override the settings? **N**

### Step 4: Set Environment Variables

```bash
vercel env add NEXT_PUBLIC_APP_URL
```

Enter your production URL when prompted.

### Step 5: Deploy to Production

```bash
vercel --prod
```

## Post-Deployment

### Testing Your Deployment

1. **On PC**: Open your production URL in a browser
2. **On Mobile**: Scan the generated QR code
3. **Test**: Submit a link from mobile and verify it opens on PC

### Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update `NEXT_PUBLIC_APP_URL` environment variable with your custom domain

## Advanced: Enable Vercel Edge Config (Optional)

For production use with persistent storage across serverless instances:

### Step 1: Create Edge Config

1. In Vercel Dashboard, go to your project
2. Click on "Storage" tab
3. Click "Create Database" → "Edge Config"
4. Give it a name (e.g., "qr-link-sessions")
5. Click "Create"

### Step 2: Get Connection String

1. Click on your newly created Edge Config
2. Copy the "Connection String"

### Step 3: Add to Environment Variables

1. Go to Project Settings → Environment Variables
2. Add new variable:
   - Name: `EDGE_CONFIG`
   - Value: Your connection string
3. Redeploy your application

### Step 4: Update Storage Implementation

Update `lib/storage.ts` to use Vercel Edge Config SDK:

```typescript
import { get, set, del } from '@vercel/edge-config';

// Replace memory store functions with Edge Config API calls
export async function createSession(sessionId: string, expiresAt: number) {
  await set(sessionId, { expiresAt, createdAt: Date.now() });
}

export async function getSession(sessionId: string) {
  const session = await get(sessionId);
  // ... implementation
}
```

**Note**: Edge Config has usage limits on the free tier. The in-memory implementation works fine for most use cases.

## Monitoring

### View Logs

**Via Dashboard:**
1. Go to your project in Vercel
2. Click "Deployments"
3. Click on a deployment
4. View "Function Logs" and "Build Logs"

**Via CLI:**
```bash
vercel logs
```

### Analytics

Vercel provides free analytics:
1. Go to your project
2. Click "Analytics" tab
3. View traffic, performance metrics, and errors

## Troubleshooting

### Build Fails

- Check build logs for specific errors
- Verify all dependencies are in `package.json`
- Ensure Node.js version compatibility

### Environment Variables Not Working

- Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Redeploy after changing environment variables
- Check that variables are set in the correct environment (Production/Preview/Development)

### SSE Not Working

- Verify your Vercel region supports streaming (most do)
- Check browser console for errors
- Some corporate firewalls may block SSE

### QR Code Shows localhost URL

- Update `NEXT_PUBLIC_APP_URL` in production environment
- Redeploy the application

## CI/CD

Vercel automatically deploys:
- **Production**: Pushes to main/master branch
- **Preview**: Pull requests and other branches

Configure in Project Settings → Git

## Scaling

The free tier includes:
- 100 GB bandwidth
- Unlimited requests
- 100 GB-hours of serverless function execution

For high traffic, consider:
- Upgrading to Pro plan
- Implementing Edge Config for session persistence
- Adding caching strategies

## Security Checklist

- ✅ Environment variables are set correctly
- ✅ HTTPS is enabled (automatic with Vercel)
- ✅ Rate limiting is implemented
- ✅ URL validation is in place
- ✅ Sessions auto-expire

## Support

For issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Visit [Vercel Community](https://github.com/vercel/vercel/discussions)
- Review application logs in Vercel Dashboard
