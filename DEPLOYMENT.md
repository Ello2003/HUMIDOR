# HUMIDOR price scanner deployment

The live price scanner is server-side because retailer search API keys must not be exposed in the browser.

## Recommended deployment

Deploy this repository to Vercel. The repository includes `api/index.ts` and `vercel.json`, which expose the existing Express API as a serverless function.

Set these Vercel environment variables:

- `GEMINI_API_KEY` — existing Gemini research key.
- `FIRECRAWL_API_KEY` — recommended for live retailer price search. When present, the price scanner tries Firecrawl first and falls back to Gemini grounded search.
- `ALLOWED_ORIGIN` — optional. Leave unset for same-origin Vercel hosting.

Firecrawl is deliberately optional; without its key the existing Gemini path remains available.

## GitHub Pages frontend

GitHub Pages can host the static frontend, but it cannot run `server.ts`. If the frontend remains on Pages, set the repository variable `VITE_API_BASE_URL` to the public URL of the deployed Vercel API, then the Pages workflow injects it at build time.

For the simplest setup, host both frontend and API on Vercel so the browser can call `/api/...` on the same origin.

## Price-scanner behaviour

The scanner only stores quotes when it can associate a price with a HTTPS retailer product/search result. It does not generate synthetic retailer prices when live retrieval fails.

Firecrawl search can return search results together with scraped page content, and its product format can expose structured product price/availability data. This makes it a better fit for retailer-price extraction than relying on one AI structured-output call. The Gemini grounded-search route remains the fallback.
