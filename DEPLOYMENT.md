# HUMIDOR deployment architecture

HUMIDOR is intentionally designed as a **$0 personal-use application**:

1. **GitHub Pages** hosts the Vite frontend.
2. **GitHub Actions** runs the UK retailer price scanner every six hours and writes the verified snapshot to `data/retailer-prices.json`.
3. The Express/Gemini server remains available for **local use on the collector's Mac**; no paid API host is required.

GitHub Pages is a static host and does not run `server.ts`.

## Price scanner

The scheduled scanner uses the repository's `FIRECRAWL_API_KEY` Actions secret directly from the GitHub runner. The key is never bundled into the browser.

The scanner is deliberately deterministic:

- Search the known UK specialist-retailer domains first.
- Search the wider web only when the first search finds no verified product.
- Require brand + exact line/variant + vitola/package compatibility.
- Prefer Firecrawl's structured product price data.
- Scrape at most four candidate product pages when structured price data is missing.
- Run up to four cigars concurrently.
- Deduplicate identical cigar requests in the same run.
- Never invent a price when no verified product page can be matched.

## Frontend and local API

The GitHub Pages build does **not** require `VITE_API_BASE_URL` and no paid API host is configured.

- Static retailer prices come from `data/retailer-prices.json`.
- Research, AI Sommelier, live identification, and basket URL research use the Express API when it is available.
- On the production GitHub Pages build, those API calls default to `http://localhost:3000`, so they work when the collector is also running HUMIDOR locally with `npm run dev`.
- If the local server is not running, the static parts of the GitHub Pages application continue to work; live API-only features simply cannot run.

The Express server keeps Gemini and Firecrawl secrets server-side and must never expose those keys to the browser.

## Local development

From the repository directory:

```bash
npm run dev
```

The local Express/Vite server runs on port 3000 and provides the API features that cannot be executed by a static GitHub Pages site.

## GitHub Pages

GitHub Pages builds and deploys `dist/` through the Pages workflow. After the price scan workflow completes successfully, the Pages workflow republishes the latest price snapshot.
