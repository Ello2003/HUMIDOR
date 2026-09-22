# The Humidor

The Humidor is a React/Vite cigar-management app with local-first vault data, research tools, wishlist hunting, and a scheduled UK retailer price snapshot.

## Run locally

```bash
npm ci
npm run dev
```

The local Express server remains available for research/import features that use `/api`.

## Production architecture

- **Frontend:** GitHub Pages
- **Price data:** GitHub Actions + Firecrawl → `data/retailer-prices.json`
- **No Vercel dependency**
- **No browser-side Firecrawl secret**

## Automated UK retailer price scans

Add an Actions secret named `FIRECRAWL_API_KEY` under **Settings → Secrets and variables → Actions**.

The workflow runs every six hours and can also be started manually from **Actions → UK Retailer Price Scan**.

Each run:
1. scans the catalog directly from the GitHub runner;
2. writes verified results to `data/retailer-prices.json`;
3. commits only that generated data when it changes;
4. triggers the Pages deployment workflow.

If a retailer cannot be verified, HUMIDOR records no quote rather than an estimate.
