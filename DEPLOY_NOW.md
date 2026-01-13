# 🚀 Ready to Deploy to Vercel!

Your application is ready for deployment. Follow these simple steps:

## Option 1: Deploy via Vercel CLI (Recommended - Fastest)

### Step 1: Login to Vercel

```bash
vercel login
```

This will open your browser. Choose your login method:
- GitHub
- GitLab
- Bitbucket
- Email

### Step 2: Deploy to Vercel

```bash
vercel
```

You'll be asked a few questions:
1. **Set up and deploy?** → Press `Y`
2. **Which scope?** → Select your account
3. **Link to existing project?** → Press `N` (first time)
4. **What's your project's name?** → `qr-link-share` (or your preferred name)
5. **In which directory is your code located?** → Press Enter (current directory)
6. **Want to override the settings?** → Press `N`

Vercel will:
- ✅ Upload your code
- ✅ Install dependencies
- ✅ Build your application
- ✅ Deploy to a preview URL

### Step 3: Get Your URL

After deployment completes, you'll see:
```
✅ Preview: https://qr-link-share-xxxxx.vercel.app
```

### Step 4: Update Environment Variable

```bash
vercel env add NEXT_PUBLIC_APP_URL production
```

When prompted, enter your production URL (the one from Step 3).

### Step 5: Deploy to Production

```bash
vercel --prod
```

This deploys to your production domain!

---

## Option 2: Deploy via Vercel Dashboard (Easiest - More Visual)

### Step 1: Push to GitHub (if you haven't already)

1. Create a new repository on GitHub: https://github.com/new
2. Name it `qr-link-share`
3. Don't initialize with README (we already have one)
4. Copy the commands shown and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/qr-link-share.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Sign in with your GitHub account
3. Click "Import Project"
4. Select your `qr-link-share` repository
5. Click "Import"

### Step 3: Configure

Vercel will auto-detect Next.js settings. You just need to:

1. Add Environment Variable:
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: Leave blank for now (we'll update after first deploy)

2. Click **"Deploy"**

### Step 4: Update Environment Variable

After first deployment:
1. Note your URL (e.g., `https://qr-link-share.vercel.app`)
2. Go to Project Settings → Environment Variables
3. Update `NEXT_PUBLIC_APP_URL` with your actual URL
4. Click "Redeploy" from the Deployments tab

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Visit your production URL
- [ ] QR code displays correctly
- [ ] QR code contains your production URL (not localhost)
- [ ] Scan QR code with mobile device
- [ ] Submit a test link from mobile
- [ ] Link opens automatically on PC
- [ ] No console errors

---

## 🎯 Next Steps After Deployment

### 1. Custom Domain (Optional)

Want a custom domain like `share.yourdomain.com`?

1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` environment variable

### 2. Monitor Your Application

View real-time logs and analytics:
- Dashboard: https://vercel.com/dashboard
- Analytics: Project → Analytics tab
- Logs: Project → Deployments → Function Logs

### 3. Enable Edge Config (Optional - For High Traffic)

For persistent storage across serverless instances:

1. In Vercel Dashboard → Storage
2. Create Edge Config
3. Copy connection string
4. Add as environment variable: `EDGE_CONFIG`
5. Redeploy

---

## 🐛 Troubleshooting

### QR Code Shows localhost

**Problem:** QR code still shows `localhost:3000`

**Solution:**
1. Verify `NEXT_PUBLIC_APP_URL` is set in production environment
2. Make sure it's your actual Vercel URL
3. Redeploy the application

### Build Fails

**Problem:** Deployment fails during build

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify all dependencies are in `package.json`
3. Test locally: `npm run build`

### Session Errors in Production

**Problem:** "Session not found" errors

**Solution:**
- This is normal for in-memory storage with multiple serverless instances
- Consider enabling Edge Config for production
- Sessions work fine for moderate traffic with current setup

---

## 📊 Vercel Free Tier Limits

Your app is designed to work within free tier:
- ✅ 100 GB bandwidth per month
- ✅ Unlimited requests
- ✅ 100 GB-hours serverless execution
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments from Git

---

## 🎉 You're All Set!

Choose your deployment method and follow the steps above. The entire process takes about 5 minutes!

**Questions?** Check the full deployment guide in `DEPLOYMENT.md`
