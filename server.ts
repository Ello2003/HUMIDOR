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
