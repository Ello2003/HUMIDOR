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
- **Price data:** GitHub Actions + direct retailer product pages → `data/retailer-prices.json` (Firecrawl is optional discovery)
- **No Vercel dependency**
- **No browser-side Firecrawl secret**

## Automated UK retailer price scans

`FIRECRAWL_API_KEY` is optional. The scanner can run without it using the configured UK retailer catalogues, sitemaps, and product pages. Add the secret only if you want Firecrawl discovery as an optional fallback.

The workflow runs every six hours and can also be started manually from **Actions → UK Retailer Price Scan**.

Each run:
1. discovers configured retailer product URLs and fetches their product pages directly from the GitHub runner;
2. writes verified results to `data/retailer-prices.json`;
3. commits only that generated data when it changes;
4. triggers the Pages deployment workflow.

If a retailer cannot be verified, HUMIDOR records no quote rather than an estimate.
