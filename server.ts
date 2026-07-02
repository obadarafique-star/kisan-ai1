import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const _filename = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(_filename);

const app = express();
const PORT = 3000;

// Increase body limit to support base64 image uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Initialize Gemini SDK lazily to prevent crash if key is missing during initial boot
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel (⚙️ > Secrets).");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 🌾 API Endpoints

// 1. Weather Intelligence & AI Advisor
app.get("/api/weather", async (req, res) => {
  const lat = req.query.lat || "28.61"; // default New Delhi
  const lon = req.query.lon || "77.23";
  const cityName = req.query.city || "New Delhi";

  try {
    // Fetch live weather data from Open-Meteo (completely free, no API key required!)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      throw new Error(`Open-Meteo response was not OK: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current_weather;
    const daily = weatherData.daily;

    // Use Gemini to produce weather-based irrigation and agricultural advice
    const ai = getGeminiClient();
    const weatherPrompt = `
      You are an expert AI Agricultural meteorologist. Based on the following weather data for ${cityName} (Latitude: ${lat}, Longitude: ${lon}):
      - Current Temperature: ${current.temperature}°C
      - Current Windspeed: ${current.windspeed} km/h
      - Weather Code: ${current.weathercode} (WMO weather code)
      - Next 3 days forecast:
        - Max Temps: ${daily.temperature_2m_max.slice(0, 3).join(", ")} °C
        - Min Temps: ${daily.temperature_2m_min.slice(0, 3).join(", ")} °C
        - Precipitation Sums: ${daily.precipitation_sum.slice(0, 3).join(", ")} mm
      
      Generate a practical agricultural advisory in English. Return a structured JSON response with exactly these fields:
      - advisory: A short summary of weather conditions.
      - irrigationAdvice: Specific instructions (e.g., "Do not irrigate today as heavy rain is forecast tomorrow" or "Increase watering due to high heatwave").
      - cropAction: Immediate precautions for crops.
      - riskLevel: "Low", "Medium", or "High".
    `;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: weatherPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advisory: { type: Type.STRING },
            irrigationAdvice: { type: Type.STRING },
            cropAction: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
          },
          required: ["advisory", "irrigationAdvice", "cropAction", "riskLevel"],
        },
      },
    });

    const parsedAdvisory = JSON.parse(aiResponse.text || "{}");

    res.json({
      success: true,
      weather: weatherData,
      advisory: parsedAdvisory,
    });
  } catch (error) {
    console.error("Error fetching weather or generating advice:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error fetching weather advice",
    });
  }
});

// 2. Mandi Crop Prices with Gemini Search Grounding
app.get("/api/mandi", async (req, res) => {
  const cropName = req.query.crop || "Tomato";
  const stateOrCity = req.query.location || "Maharashtra";

  try {
    const ai = getGeminiClient();
    const queryStr = `current mandi price of ${cropName} in ${stateOrCity} APMC Indian markets today`;

    // Call Gemini with Google Search grounding to get real-time price reports
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `
        Search and summarize the current mandi/APMC prices for ${cropName} in ${stateOrCity} markets today in Indian Rupees (INR) per quintal.
        If no exact today's price is available, provide the latest 2026 prices.
        Include a professional summary of price trends (e.g., whether to sell now or wait).
        
        Provide the response strictly in JSON format matching this schema:
        {
          "crop": "string",
          "location": "string",
          "averagePrice": "string (e.g. ₹2,200/quintal)",
          "priceRange": "string (e.g. ₹1,800 - ₹2,500/quintal)",
          "trend": "Upward" | "Downward" | "Stable",
          "advice": "string (explanation of price behavior and selling recommendations, e.g., 'Sell after 2 days because prices are expected to improve')",
          "markets": [
            { "name": "string (e.g. Pune APMC)", "price": "string" }
          ]
        }
      `,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            crop: { type: Type.STRING },
            location: { type: Type.STRING },
            averagePrice: { type: Type.STRING },
            priceRange: { type: Type.STRING },
            trend: { type: Type.STRING },
            advice: { type: Type.STRING },
            markets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.STRING },
                },
                required: ["name", "price"],
              },
            },
          },
          required: ["crop", "location", "averagePrice", "priceRange", "trend", "advice", "markets"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");

    // Extract citation URLs for the farmer
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Mandi Report",
      uri: chunk.web?.uri,
    })).filter((c: any) => c.uri) || [];

    res.json({
      success: true,
      data: parsedData,
      sources,
    });
  } catch (error) {
    console.error("Error in mandi prices api:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in Mandi API",
    });
  }
});

// 3. Crop Disease Detection & Vision Analysis
app.post("/api/disease", async (req, res) => {
  const { image, description, language } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, error: "Image is required." });
  }

  try {
    const ai = getGeminiClient();

    // Prepare vision parts
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: image.split(",")[1] || image, // strip data:image/jpeg;base64 header if present
      },
    };

    const userPrompt = description || "Analyze this crop or plant image for diseases.";
    const targetLanguage = language || "English";

    const promptText = `
      You are an expert AI Crop Disease Diagnostician and Agronomist. 
      Analyze the attached plant/crop image. Detect any diseases, pest infestation, nutrient deficiencies, or identify if the plant is healthy.
      The farmer provided this description/context: "${userPrompt}".
      
      Generate a detailed, practical diagnosis. Your explanation, medicine names, precautions, and recommendations MUST be written in ${targetLanguage}.
      
      Return a response strictly conforming to the following JSON structure:
      {
        "status": "healthy" | "diseased" | "unknown",
        "crop": "string (name of crop/plant identified, e.g. Tomato)",
        "disease": "string (common name of the disease or 'Healthy Crop' in ${targetLanguage})",
        "confidence": "string (percentage e.g. 94%)",
        "severity": "Low" | "Medium" | "High",
        "reason": "string (detailed reason/cause of the disease in ${targetLanguage})",
        "medicine": "string (specific recommended organic or chemical treatment/medicine/fungicide/pesticide)",
        "fertilizer": "string (recommended fertilizer or nutrient adjustment e.g. NPK 20:20:20)",
        "watering": "string (watering recommendation e.g. Reduce watering, morning only)",
        "precautions": ["array of 2-3 precautions to prevent spread in ${targetLanguage}"],
        "nextSteps": "string (immediate actionable next step for the farmer in ${targetLanguage})"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            crop: { type: Type.STRING },
            disease: { type: Type.STRING },
            confidence: { type: Type.STRING },
            severity: { type: Type.STRING },
            reason: { type: Type.STRING },
            medicine: { type: Type.STRING },
            fertilizer: { type: Type.STRING },
            watering: { type: Type.STRING },
            precautions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            nextSteps: { type: Type.STRING },
          },
          required: [
            "status",
            "crop",
            "disease",
            "confidence",
            "severity",
            "reason",
            "medicine",
            "fertilizer",
            "watering",
            "precautions",
            "nextSteps",
          ],
        },
      },
    });

    const parsedResult = JSON.parse(response.text || "{}");

    res.json({
      success: true,
      result: parsedResult,
    });
  } catch (error) {
    console.error("Error analyzing crop disease:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in disease analysis",
    });
  }
});

// 4. Multilingual Agricultural Chatbot / Advisory Assistant
app.post("/api/chat", async (req, res) => {
  const { messages, language } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, error: "Messages array is required." });
  }

  try {
    const ai = getGeminiClient();
    const targetLanguage = language || "English";

    // Format chat history
    const conversation = messages.map(msg => `${msg.role === "user" ? "Farmer" : "AI Assistant"}: ${msg.content}`).join("\n");

    const systemInstruction = `
      You are 'Kisan Mitra', a friendly, compassionate, and highly knowledgeable AI Agricultural Chatbot who serves hardworking farmers.
      Your goal is to answer farming queries, recommend suitable fertilizers or solutions, explain plant disease symptoms in simple language,
      and match queries with beneficial Indian Government Schemes (such as PM-KISAN, PM Fasal Bima Yojana / Crop Insurance, Soil Health Card, or Fertilizer Subsidies).
      
      CRITICAL: You must write your response completely in ${targetLanguage}.
      Use clear, scannable bullet points and bold headers. Keep explanations simple, reassuring, and practical for rural farmers.
    `;

    const promptText = `
      Current language: ${targetLanguage}.
      Here is the conversation history:
      ${conversation}
      
      Farmer's newest message: "${messages[messages.length - 1].content}"
      Please respond as 'Kisan Mitra' in ${targetLanguage}.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
      },
    });

    res.json({
      success: true,
      reply: response.text,
    });
  } catch (error) {
    console.error("Error in agricultural chat:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in chatbot",
    });
  }
});

// Serve Vite dev / build configuration
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌾 Kisan Alert server running on port ${PORT}`);
  });
}

startServer();
