<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4ebb76a2-a3f3-4f51-9872-df04620739ad

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Automated UK retailer price scans

UK retailer price scanning now runs in GitHub Actions rather than requiring Vercel to execute the Firecrawl job.

1. Add a repository Actions secret named `FIRECRAWL_API_KEY` under **Settings → Secrets and variables → Actions**.
2. Open **Actions → UK Retailer Price Scan** and run it manually once.
3. The workflow also runs automatically every 6 hours.
4. The scan writes verified results to `data/retailer-prices.json`, which the GitHub Pages frontend reads by default.
5. `VITE_API_BASE_URL` remains an optional escape hatch for a live API deployment; when it is unset, the frontend uses the latest GitHub Actions snapshot.

The Firecrawl key is only exposed to the GitHub Actions runner through the repository secret; it is not bundled into the frontend.
