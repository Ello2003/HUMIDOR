import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini API client initialization
let genAiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    genAiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint: Deep Cigar Research & Dossier Lookup
app.post("/api/research/cigar", async (req, res) => {
  try {
    const { cigarName, brand, vitola } = req.body;
    if (!cigarName && !brand) {
      return res.status(400).json({ error: "Please provide a cigar name or brand." });
    }

    const ai = getGeminiClient();
    const query = `${brand || ""} ${cigarName || ""} ${vitola || ""}`.trim();

    const systemInstruction = `You are a world-class Master Tobacconist, Cigar Sommelier, and historian with deep encyclopedic knowledge of premium hand-rolled cigars, tobacco varieties, wrappers, terroir, vitolas, aging science, and spirits pairings. Return structured, highly accurate, and engaging cigar research in JSON format.`;

    const prompt = `Provide a comprehensive connoisseur research dossier for the following cigar: "${query}".
Include precise wrapper, binder, filler information, factory & blender history, typical flavor profile broken down into 1st Third, 2nd Third, and Final Third, aging/resting recommendations, pairing suggestions (spirits, wine, coffee/tea, non-alcoholic), recommended cut & lighting method, ring gauge and length specifications, and interesting trivia or factory notes.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cigarName: { type: Type.STRING },
            brand: { type: Type.STRING },
            line: { type: Type.STRING },
            countryOrigin: { type: Type.STRING },
            factory: { type: Type.STRING },
            masterBlender: { type: Type.STRING },
            vitolaCommon: { type: Type.STRING },
            lengthInches: { type: Type.STRING },
            ringGauge: { type: Type.STRING },
            wrapper: { type: Type.STRING },
            binder: { type: Type.STRING },
            filler: { type: Type.STRING },
            strength: { type: Type.STRING, description: "Mild, Mild-Medium, Medium, Medium-Full, or Full" },
            body: { type: Type.STRING },
            summary: { type: Type.STRING },
            flavorTransitions: {
              type: Type.OBJECT,
              properties: {
                firstThird: {
                  type: Type.OBJECT,
                  properties: {
                    overview: { type: Type.STRING },
                    keyNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["overview", "keyNotes"],
                },
                secondThird: {
                  type: Type.OBJECT,
                  properties: {
                    overview: { type: Type.STRING },
                    keyNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["overview", "keyNotes"],
                },
                finalThird: {
                  type: Type.OBJECT,
                  properties: {
                    overview: { type: Type.STRING },
                    keyNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["overview", "keyNotes"],
                },
              },
              required: ["firstThird", "secondThird", "finalThird"],
            },
            dominantFlavorTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            idealPairings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "e.g. Bourbon, Scotch, Coffee, Beer, Rum, Wine" },
                  beverageName: { type: Type.STRING },
                  whyItWorks: { type: Type.STRING },
                },
                required: ["category", "beverageName", "whyItWorks"],
              },
            },
            agingGuidance: {
              type: Type.OBJECT,
              properties: {
                idealRestMonths: { type: Type.STRING },
                peakAgingWindow: { type: Type.STRING },
                agingImpact: { type: Type.STRING },
              },
              required: ["idealRestMonths", "peakAgingWindow", "agingImpact"],
            },
            smokingTips: {
              type: Type.OBJECT,
              properties: {
                cutRecommendation: { type: Type.STRING },
                lightingTip: { type: Type.STRING },
                pacingMinutes: { type: Type.STRING },
              },
              required: ["cutRecommendation", "lightingTip", "pacingMinutes"],
            },
            historyTrivia: { type: Type.STRING },
            estimatedRatingScore: { type: Type.NUMBER, description: "Typical critic consensus 1-100" },
          },
          required: [
            "cigarName",
            "brand",
            "countryOrigin",
            "wrapper",
            "binder",
            "filler",
            "strength",
            "summary",
            "flavorTransitions",
            "dominantFlavorTags",
            "idealPairings",
            "agingGuidance",
            "smokingTips",
          ],
        },
      },
    });

    const text = response.text || "{}";
    const parsedData = JSON.parse(text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error in /api/research/cigar:", error);
    return res.status(500).json({
      error: error.message || "Failed to research cigar. Please try again.",
    });
  }
});

// Endpoint: AI Sommelier Recommendation (Mood / Drink / Time matching from humidor)
app.post("/api/research/sommelier", async (req, res) => {
  try {
    const { mood, availableTime, drinkPairing, currentInventory, preferenceNotes } = req.body;

    const ai = getGeminiClient();
    const systemInstruction = `You are an elite Private Cigar Sommelier advising a personal collector on what cigar to smoke tonight from their humidor or recommending a fitting stick. Provide elegant, insightful recommendations with flavor pairing rationale.`;

    const prompt = `Provide tailored cigar recommendations for the user based on the following session context:
- Mood / Setting: ${mood || "Relaxing evening"}
- Available Smoking Time: ${availableTime || "60 minutes"}
- Drink Pairing: ${drinkPairing || "Bourbon or Espresso"}
- Additional Preferences: ${preferenceNotes || "Looking for something flavorful and balanced"}
- Current Humidor Inventory: ${
      currentInventory && currentInventory.length > 0
        ? JSON.stringify(
            currentInventory.map((c: any) => ({
              id: c.id,
              name: `${c.brand} ${c.name} (${c.vitola})`,
              strength: c.strength,
              wrapper: c.wrapper,
              quantity: c.quantity,
              restDays: c.restDays,
            }))
          )
        : "None provided / open recommendation"
    }

Suggest the best option(s) from their humidor if available, plus 2-3 dream recommendations that match this vibe. Include exact reasons why the vitola, tobacco blend, and strength complement the time limit and drink pairing.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sommelierGreeting: { type: Type.STRING },
            humidorPick: {
              type: Type.OBJECT,
              properties: {
                cigarId: { type: Type.STRING },
                cigarName: { type: Type.STRING },
                reason: { type: Type.STRING },
                expectedSmokeDuration: { type: Type.STRING },
                pairingAdvice: { type: Type.STRING },
                tastingHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            curatedRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  brand: { type: Type.STRING },
                  cigarName: { type: Type.STRING },
                  vitola: { type: Type.STRING },
                  strength: { type: Type.STRING },
                  whyItFits: { type: Type.STRING },
                  flavorHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["brand", "cigarName", "vitola", "strength", "whyItFits", "flavorHighlights"],
              },
            },
            sessionTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["sommelierGreeting", "curatedRecommendations", "sessionTips"],
        },
      },
    });

    const text = response.text || "{}";
    const parsedData = JSON.parse(text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error in /api/research/sommelier:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate sommelier recommendations.",
    });
  }
});

// Endpoint: Identify Cigar from Description / Band or generate tasting notes
app.post("/api/research/identify", async (req, res) => {
  try {
    const { description, bandDetails, wrapperColor } = req.body;
    if (!description && !bandDetails) {
      return res.status(400).json({ error: "Please provide a description or band details." });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are an expert cigar identifier and cataloger. Help a cigar enthusiast identify a cigar from visual cues, band color, logos, embossed symbols, wrapper shade, and flavor traits.`;

    const prompt = `Identify potential cigar matches for this description:
- Description / Band Details: "${description || ""}"
- Band Markings / Colors: "${bandDetails || ""}"
- Wrapper Color / Appearance: "${wrapperColor || ""}"

List the most probable matches with their maker, line, wrapper type, and distinguishing features.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  brand: { type: Type.STRING },
                  line: { type: Type.STRING },
                  confidence: { type: Type.STRING, description: "High, Medium, or Low" },
                  wrapper: { type: Type.STRING },
                  origin: { type: Type.STRING },
                  keyFeatures: { type: Type.STRING },
                },
                required: ["brand", "line", "confidence", "wrapper", "origin", "keyFeatures"],
              },
            },
            identificationAdvice: { type: Type.STRING },
          },
          required: ["matches", "identificationAdvice"],
        },
      },
    });

    const text = response.text || "{}";
    const parsedData = JSON.parse(text);
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error in /api/research/identify:", error);
    return res.status(500).json({
      error: error.message || "Failed to identify cigar.",
    });
  }
});

// Helper to sanitize & extract text from raw HTML
function cleanHtmlContent(html: string): { title: string; metaDesc: string; ogImage: string; textContent: string; jsonLd: string } {
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) title = titleMatch[1].trim();

  let metaDesc = "";
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  if (descMatch) metaDesc = descMatch[1].trim();

  let ogImage = "";
  const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogImgMatch) ogImage = ogImgMatch[1].trim();

  // Extract JSON-LD if present (many e-commerce sites like C.Gars provide schema.org Product data)
  let jsonLd = "";
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    jsonLd = jsonLdMatches.map((m) => m.replace(/<\/?script[^>]*>/gi, "").trim()).join("\n");
  }

  // Strip script, style, comments, and tags for readable text
  let stripped = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&pound;/g, "£")
    .replace(/&#163;/g, "£")
    .replace(/\s+/g, " ")
    .trim();

  // Keep first 18,000 characters for token efficiency
  if (stripped.length > 18000) {
    stripped = stripped.substring(0, 18000);
  }

  return { title, metaDesc, ogImage, textContent: stripped, jsonLd: jsonLd.substring(0, 4000) };
}

// Endpoint: Scrape & Auto-Populate Cigar from Retailer Website (e.g. C.Gars Ltd, Havana House, etc.)
app.post("/api/import/cigar-from-url", async (req, res) => {
  try {
    const { url, rawContent } = req.body;
    if (!url && !rawContent) {
      return res.status(400).json({ error: "Please provide a website URL or pasted product content." });
    }

    let fetchedHtml = "";
    let extractedImage = "";
    let extractedTitle = "";
    let extractedDesc = "";
    let extractedJsonLd = "";
    let cleanText = "";
    let vendorName = "Online Cigar Retailer";

    if (url) {
      try {
        const parsedUrl = new URL(url);
        const host = parsedUrl.hostname.toLowerCase();
        if (host.includes("cgars") || host.includes("c-gars")) {
          vendorName = "C.Gars Ltd (UK)";
        } else if (host.includes("havanahouse")) {
          vendorName = "Havana House (UK)";
        } else if (host.includes("smoke-king") || host.includes("smokeking")) {
          vendorName = "Smoke King (UK)";
        } else if (host.includes("sautter")) {
          vendorName = "Sautter Cigars (London)";
        } else if (host.includes("davidoff")) {
          vendorName = "Davidoff of London";
        } else if (host.includes("foxcigar")) {
          vendorName = "Fox Cigar";
        } else if (host.includes("neptunecigar")) {
          vendorName = "Neptune Cigar";
        } else if (host.includes("famous-smoke")) {
          vendorName = "Famous Smoke Shop";
        } else if (host.includes("holts")) {
          vendorName = "Holt's Cigar Co.";
        } else {
          vendorName = host.replace("www.", "").split(".")[0].toUpperCase();
        }

        // Fetch page with standard browser headers
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
          },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          fetchedHtml = await response.text();
          const parsed = cleanHtmlContent(fetchedHtml);
          extractedTitle = parsed.title;
          extractedDesc = parsed.metaDesc;
          extractedImage = parsed.ogImage;
          extractedJsonLd = parsed.jsonLd;
          cleanText = parsed.textContent;
        }
      } catch (fetchErr: any) {
        console.warn(`Direct fetch for ${url} encountered: ${fetchErr.message}. Will use AI search grounding.`);
      }
    }

    if (rawContent && !cleanText) {
      const parsed = cleanHtmlContent(rawContent);
      cleanText = parsed.textContent || rawContent;
      if (parsed.title) extractedTitle = parsed.title;
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are an expert Master Tobacconist and data extraction engine specializing in British and international cigar retailers (including C.Gars Ltd cgarsltd.co.uk, Havana House, Smoke King, Sautter, etc.). Your job is to extract precise cigar specifications, blend composition, country of origin, vitola shape, ring gauge, length, strength, tasting notes, and price in British Pounds (£ GBP).`;

    let prompt = "";
    if (cleanText) {
      prompt = `Extract structured cigar product information from this webpage/text:
Source URL: ${url || "Pasted Content"}
Detected Store: ${vendorName}
Page Title: ${extractedTitle}
Meta Description: ${extractedDesc}
JSON-LD Data: ${extractedJsonLd}
Extracted Text Content:
${cleanText}

Extract:
- Exact Brand / Maker (e.g. Montecristo, Cohiba, Partagás, Ramón Allones, Romeo y Julieta, Padrón, Arturo Fuente, Davidoff, Trinidad, Bolivar, Hoyo de Monterrey, Olíva, Plasencia)
- Cigar Name / Line (e.g. "No. 4", "Serie D No. 4", "Specially Selected", "Wide Churchill", "1926 Serie", "OpusX")
- Vitola Format / Shape (e.g. "Robusto", "Petit Corona", "Churchill", "Toro", "Corona Gorda", "Pirámides / Torpedo", "Gordo")
- Length in inches (numeric, e.g. 5.1, 4.88, 5.0) and ring gauge (integer, e.g. 42, 50, 52)
- Country of Origin (e.g. "Cuba", "Nicaragua", "Dominican Republic", "Honduras", "Mexico")
- Wrapper leaf variety (e.g. "Cuban", "Ecuadorian Habano", "Connecticut Broadleaf", "Mexican San Andrés", "Nicaraguan Sun Grown Maduro")
- Binder and Filler blend if specified
- Strength rating ("Mild", "Mild-Medium", "Medium", "Medium-Full", "Full", or "Full-Bodied")
- Purchase Price in British Pounds (£ GBP). Extract the single stick price if available, or unit price. If only box price is found, state the single price calculated from box count.
- Vendor / Store name (${vendorName})
- Curated Tasting Notes & 4-6 dominant flavor descriptor tags (e.g. ["Spanish Cedar", "Dark Chocolate", "Rich Soil", "Baking Spice", "White Pepper"])
- Short summary of why this cigar is celebrated.`;
    } else {
      // Fallback using URL and product search
      prompt = `Look up and extract the exact cigar specifications for this product link: "${url}".
Identify the brand, vitola, length, ring gauge, country of origin, wrapper, binder, filler, strength, typical UK price in British Pounds (£ GBP), flavor notes, and vendor.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING, description: "Maker/Brand name, e.g. Montecristo, Padrón, Partagás" },
            name: { type: Type.STRING, description: "Cigar model / line name, e.g. No. 4, Serie D No. 4, 1964 Exclusivo" },
            line: { type: Type.STRING, description: "Sub-series or line" },
            vitola: { type: Type.STRING, description: "Vitola shape, e.g. Robusto, Petit Corona, Toro, Churchill" },
            lengthInches: { type: Type.NUMBER, description: "Length in inches, e.g. 5.12, 4.88" },
            lengthMm: { type: Type.NUMBER, description: "Length in millimeters if available, e.g. 129" },
            ringGauge: { type: Type.INTEGER, description: "Ring gauge integer, e.g. 42, 50" },
            countryOrigin: { type: Type.STRING, description: "Cuba, Nicaragua, Dominican Republic, Honduras, etc." },
            wrapper: { type: Type.STRING, description: "Wrapper tobacco type, e.g. Cuban, Ecuadorian Habano, Maduro" },
            binder: { type: Type.STRING },
            filler: { type: Type.STRING },
            strength: { type: Type.STRING, description: "Mild, Mild-Medium, Medium, Medium-Full, Full, or Full-Bodied" },
            purchasePrice: { type: Type.NUMBER, description: "Price in British Pounds (£) per single stick, e.g. 24.50" },
            boxPrice: { type: Type.NUMBER, description: "Price of full box if listed in £" },
            boxCount: { type: Type.INTEGER, description: "Number of cigars in box if applicable" },
            currency: { type: Type.STRING, description: "Currency symbol, defaults to £" },
            vendor: { type: Type.STRING, description: "Retailer name, e.g. C.Gars Ltd, Havana House" },
            productDescription: { type: Type.STRING, description: "Clean overview from retailer" },
            notes: { type: Type.STRING, description: "Tasting notes summary" },
            flavorTags: { type: Type.ARRAY, items: { type: Type.STRING } },
            idealRestMonths: { type: Type.INTEGER, description: "Suggested resting time in months" },
            isCuban: { type: Type.BOOLEAN },
            imageUrl: { type: Type.STRING, description: "Product image URL if available" },
          },
          required: [
            "brand",
            "name",
            "vitola",
            "countryOrigin",
            "wrapper",
            "strength",
            "purchasePrice",
            "vendor",
            "notes",
            "flavorTags",
          ],
        },
      },
    });

    const text = response.text || "{}";
    const extractedData = JSON.parse(text);

    // Attach imageUrl from OpenGraph if not detected in schema
    if (!extractedData.imageUrl && extractedImage) {
      extractedData.imageUrl = extractedImage;
    }
    extractedData.sourceUrl = url || "";
    if (!extractedData.currency) {
      extractedData.currency = "£";
    }

    return res.json({ success: true, data: extractedData });
  } catch (error: any) {
    console.error("Error in /api/import/cigar-from-url:", error);
    return res.status(500).json({
      error: error.message || "Failed to extract cigar details from website.",
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cigar Dashboard server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
