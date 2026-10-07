# Deploy HUMIDOR to Railway (Free Tier, No Card Required)

## Prerequisites

- GitHub account (repo already set up: https://github.com/Ello2003/HUMIDOR)
- Gemini API key from [Google AI Studio](https://ai.google.dev)
- Railway account (free tier at [railway.app](https://railway.app) - GitHub login only, no card required)

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev)
2. Click **"Get API Key"** → **"Create API Key in new Google Cloud project"**
3. Copy the key and save it

## Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize GitHub and select `Ello2003/HUMIDOR`
5. Railway auto-detects Node.js; click **"Deploy"**
6. Wait ~2-3 minutes for build to complete

## Step 3: Set Environment Variables

1. In Railway dashboard, click your **humidor** project
2. Go to **Variables** tab
3. Add new variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: (paste your Gemini API key)
4. Click **"Add"** → variables auto-save
5. Redeploy by pushing a new commit or clicking **"Redeploy"**

## Step 4: Get Your Live URL

1. In Railway dashboard, click **Deployments** tab
2. Find the active deployment
3. Click the **URL** button at top-right to copy your app URL
4. Example: `https://humidor-production.up.railway.app`

## Step 5: Test It Works

- Open your Railway URL
- Try adding a cigar
- Try scanning retailer prices → should now work ✅

## Local Development

Test locally before pushing:

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 3. Run dev server (http://localhost:3000)
npm run dev
```

## Troubleshooting

### Build fails
- Check Railway **Logs** tab for error details
- Common issue: missing `esbuild` in `devDependencies` (already fixed in package.json)

### Price scan still fails after deployment
- Verify `GEMINI_API_KEY` is in Railway **Variables** tab
- Check app **Logs** for error messages
- Force redeploy: push a new commit to GitHub

### App loads but endpoints return 404
- Make sure `start` script is `node dist/server.cjs`
- Railway should auto-detect this from package.json

---

**Free tier includes**: 5 GB storage, shared CPU, enough for this app. No card required.

Your app is now live! 🎉
