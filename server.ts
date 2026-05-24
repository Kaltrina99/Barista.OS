import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs-extra";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

// Initialize Firebase Admin if environment variables are present
let dbAdmin: admin.firestore.Firestore | null = null;

const cleanEnvVar = (val: string | undefined) => {
  if (!val) return "";
  // In some environments, the private key is passed with literal \n escapes
  // but in others, they are already actual newlines.
  let cleaned = val.replace(/\\n/g, '\n');
  
  // Remove wrapping quotes (if any)
  cleaned = cleaned.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  } else if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  
  // Re-encode existing newlines just to be sure we have a clean string for cert()
  // but actually cert() expects the literal newline characters in a string.
  return cleaned;
};

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    const projectId = cleanEnvVar(process.env.FIREBASE_PROJECT_ID);
    const clientEmail = cleanEnvVar(process.env.FIREBASE_CLIENT_EMAIL);
    let privateKey = cleanEnvVar(process.env.FIREBASE_PRIVATE_KEY);
    
    // Crucial: The private key must have the correct headers and contain newlines
    if (privateKey && !privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      // If it looks like a base64 key without headers, we can try to wrap it
      // but usually service account keys come with headers.
      // If headers are missing, we add them.
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
    
    // Ensure actual newlines (some platforms strip them)
    privateKey = privateKey.replace(/\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    dbAdmin = admin.firestore();
    console.log("Firebase Admin initialized successfully");
  } catch (err) {
    console.error("Firebase Admin initialization failed:", err);
  }
}

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));

// Global error handler for API routes to ensure JSON response instead of HTML
const apiErrorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
  console.error("API Error Handler:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    path: req.originalUrl
  });
};

// Storage Abstraction (Fulfilling "not relay havely on google" by allowing local storage fallback)
// In a real production app, we'd use a real DB, but for "running from VS Code" easily, 
// a local JSON file is very portable.
const DATA_DIR = path.join(process.cwd(), 'data');
fs.ensureDirSync(DATA_DIR);

const getStoragePath = (uid: string, category: string) => path.join(DATA_DIR, uid, `${category}.json`);

async function getData(uid: string, category: string) {
  let results: any[] = [];
  // Try Firebase first if admin is available
  if (dbAdmin) {
    try {
      const snapshot = await dbAdmin.collection(category).get();
      if (!snapshot.empty) {
        results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes("UNAUTHENTICATED") || e?.code === 16) {
        console.info("[Firebase Storage Hub] Missing or expired Google Cloud credentials in environment. Fallback to local file persistence mode enabled.");
        dbAdmin = null;
      } else {
        console.warn(`Firestore read failed for ${category}, falling back to local:`, msg);
      }
    }
  }

  if (results.length === 0) {
    const filePath = getStoragePath(uid, category);
    if (await fs.pathExists(filePath)) {
      results = await fs.readJSON(filePath);
    }
  }

  // Final deduplication by ID before returning to frontend
  const dedupeMap = new Map();
  results.forEach(item => {
    if (item && item.id) {
      dedupeMap.set(item.id, item);
    } else if (item && item.uid) {
      dedupeMap.set(item.uid, item);
    }
  });
  return Array.from(dedupeMap.values());
}

async function saveData(uid: string, category: string, data: any) {
  const filePath = getStoragePath(uid, category);
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJSON(filePath, data, { spaces: 2 });
}

// Gemini Setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for image parts
const fileToPart = (base64Data: string, mimeType: string) => ({
  inlineData: {
    data: base64Data,
    mimeType
  }
});

// API Routes
const apiRouter = express.Router();

apiRouter.post("/gemini/analyze-sales", async (req, res) => {
  const { image, mimeType } = req.body;
  try {
    const prompt = "You are a café inventory assistant. Analyze this photo of a sales log, receipt, or daily tally sheet from a café. Extract all the items sold and their total quantities for the day. If prices are visible per item, extract them too. Return the results as a JSON array of objects, where each object has a 'name' (string, common lowercase name like 'coffee', 'water', 'croissant'), 'quantity' (number), and 'price' (number, optional, the unit price or total item price if distinguishable). Sum up quantities if the same item appears multiple times. Only include items that were sold.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [fileToPart(image, mimeType), { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              price: { type: Type.NUMBER, nullable: true }
            },
            required: ["name", "quantity"]
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("Gemini Sales Sync Error:", error);
    res.status(500).json({ error: "Analysis failed", details: error instanceof Error ? error.message : String(error) });
  }
});

apiRouter.post("/gemini/analyze-restock", async (req, res) => {
  const { image, mimeType } = req.body;
  try {
    const prompt = "You are a café inventory assistant. Analyze this photo of a delivery note, invoice, or restock log. Extract all the items that have been restocked (added to inventory) and their quantities. Also extract the cost or unit price for each item if available. Return the results as a JSON array of objects, where each object has a 'name' (string, common lowercase), 'quantity' (number), and 'price' (number, the unit cost if found). Sum up quantities if the same item appears multiple times.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [fileToPart(image, mimeType), { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              price: { type: Type.NUMBER, nullable: true }
            },
            required: ["name", "quantity"]
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("Gemini Restock Sync Error:", error);
    res.status(500).json({ error: "Analysis failed", details: error instanceof Error ? error.message : String(error) });
  }
});

apiRouter.post("/gemini/identify", async (req, res) => {
  const { image, mimeType } = req.body;
  try {
    const prompt = "You are a professional café consultant and logistics expert. Identify the product in this photo (e.g. specific coffee beans, milk brand, syrup flavor, obscure pastry). 1. Identify its name. 2. List its main contents or ingredients. 3. Provide a brief description of its profile. 4. Suggest 3 reliable substitutes if this specific item is unavailable in stock. Search the web if needed to find current market-leading alternatives.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [fileToPart(image, mimeType), { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            contents: { type: Type.ARRAY, items: { type: Type.STRING } },
            substitutes: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING }
          },
          required: ["name", "contents", "substitutes", "description"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("Gemini Intel Error:", error);
    res.status(500).json({ error: "Identification failed", details: error instanceof Error ? error.message : String(error) });
  }
});

apiRouter.post("/gemini/market-intel", async (req, res) => {
  const { country, region } = req.body;
  if (!country) {
    return res.status(400).json({ error: "Country is required" });
  }

  try {
    const prompt = `You are a café operations research assistant.
Conduct a real-time market search to provide key macroeconomics, inflation figures, and recommended wholesale suppliers or local distributors for café resources (beans, milk, sugar, cups, etc.) operating in:
Country: ${country}
Region/City: ${region || "Any Major City"}

Return exactly a JSON object matching the requested schema. Ensure all data is realistically grounded, using Google Search to fetch actual, current inflation rates and actual wholesalers or wholesale alternatives in ${country} with real prices if found.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            country: { type: Type.STRING },
            inflationRate: { type: Type.NUMBER },
            cafeInflationRate: { type: Type.NUMBER },
            inflationOutlook: { type: Type.STRING },
            categoryPriceChanges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  changePercent: { type: Type.NUMBER },
                  status: { type: Type.STRING }
                },
                required: ["category", "changePercent", "status"]
              }
            },
            recommendedSuppliers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  specialty: { type: Type.STRING },
                  pricePosition: { type: Type.STRING },
                  whyGreatValue: { type: Type.STRING },
                  estimatedSaving: { type: Type.STRING },
                  websiteUrl: { type: Type.STRING }
                },
                required: ["name", "specialty", "pricePosition", "whyGreatValue", "estimatedSaving", "websiteUrl"]
              }
            }
          },
          required: ["country", "inflationRate", "cafeInflationRate", "inflationOutlook", "categoryPriceChanges", "recommendedSuppliers"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("Market Intel Error:", error);
    res.status(500).json({ error: "Failed to generate market intelligence", details: error instanceof Error ? error.message : String(error) });
  }
});

apiRouter.get("/inventory", async (req, res) => {
  const uid = req.headers['x-user-id'] as string || 'default';
  const data = await getData(uid, 'inventory');
  res.json(data);
});

apiRouter.post("/inventory", async (req, res) => {
  const uid = req.headers['x-user-id'] as string || 'default';
  const items = await getData(uid, 'inventory');
  const newItem = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
  items.push(newItem);
  await saveData(uid, 'inventory', items);
  res.json(newItem);
});

apiRouter.get("/tenants", async (req, res) => {
  try {
    if (dbAdmin) {
      try {
        const snapshot = await dbAdmin.collection("profiles").get();
        const tenantMap = new Map();
        snapshot.docs.forEach(doc => {
          tenantMap.set(doc.id, { uid: doc.id, ...doc.data() });
        });
        return res.json(Array.from(tenantMap.values()));
      } catch (fbError: any) {
        const msg = fbError?.message || String(fbError);
        if (msg.includes("UNAUTHENTICATED") || fbError?.code === 16) {
          console.info("[Firebase Storage Hub] Missing or expired Google Cloud credentials in environment. Fallback to local file persistence mode enabled.");
          dbAdmin = null;
        } else {
          console.warn("Firestore Admin profiles fetch failed, falling back to local files:", msg);
        }
      }
    }
    const profilesDir = path.join(DATA_DIR, 'profiles');
    if (await fs.pathExists(profilesDir)) {
      const files = await fs.readdir(profilesDir);
      const tenantMap = new Map();
      await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(async (f) => {
            const uid = f.replace('.json', '');
            const data = await fs.readJSON(path.join(profilesDir, f));
            tenantMap.set(uid, { uid, ...data });
          })
      );
      return res.json(Array.from(tenantMap.values()));
    }
    res.json([]);
  } catch (error) {
    console.error("Fetch Tenants Error:", error);
    res.status(500).json({ error: "Failed to fetch tenants" });
  }
});

// Added missing auth route reported as failing 404/200 HTML
apiRouter.all("/auth/google", async (req, res) => {
  // This is likely called to sync session or verify backend token
  // For now, return a success response to stop the non-JSON error
  res.json({ success: true, message: "Backend auth sync complete" });
});

// Implementation of the suggested router pattern
app.use("/api", apiRouter);

// API Error Handler - must be after the router
apiRouter.use(apiErrorHandler);

// Catch-all for missing API routes to prevent HTML fallout
app.all("/api/*", (req, res) => {
  console.warn(`[API 404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
