# HUMIDOR deployment architecture

HUMIDOR is now intentionally split into two simple pieces:

1. **GitHub Pages** hosts the Vite frontend.
2. **GitHub Actions** runs the UK retailer price scanner every six hours and writes the verified snapshot to `data/retailer-prices.json`.

There is no Vercel deployment and no serverless price endpoint in the production architecture.

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

This makes scheduled scans cheaper and faster than starting the full Express/Gemini server for every run.

## Frontend

GitHub Pages hosts the Vite frontend as a static site.

`VITE_API_BASE_URL` is a public build-time variable containing the origin of the separately hosted Express API. When it is set, browser research, AI Sommelier, identification, imports, and other API features call that service.

When `VITE_API_BASE_URL` is unset, the browser continues to use relative `/api/...` paths and the static retailer-price snapshot remains available from `data/retailer-prices.json`.

The Express server holds the Gemini and Firecrawl secrets server-side and must never expose those keys to the browser.

## GitHub Pages

GitHub Pages is a static host; it does not run the Express backend. The Pages workflow builds the Vite app and deploys `dist/`.

After the price scan workflow completes successfully, the Pages workflow is triggered with `workflow_run` and republishes the latest price snapshot.
