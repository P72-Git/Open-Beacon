import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client on the server side
let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
} catch (e) {
  console.warn("Failed to initialize GoogleGenAI. Is GEMINI_API_KEY set?");
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Proxy route for searching places
app.post("/api/searchPlaces", async (req, res) => {
  const { query, lat, lng } = req.body;
  if (!query || lat == null || lng == null) {
     res.status(400).json({ error: "Missing required parameters" });
     return;
  }

  try {
    const groundedResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for "${query}" near latitude ${lat}, longitude ${lng} using the Google Maps tool. Find at least 5-10 results. Include places that are open now, but also include highly-rated places even if they are currently closed. For each place, I need: name, address, category, rating, distance, and current open/closed status with hours.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });

    console.log("Grounded Response for", query, ":", groundedResponse.text);
    const groundedText = groundedResponse.text || '';
    
    if (!groundedText || groundedText.trim() === '') {
      console.log("No places found from Google Maps");
      res.json([]);
      return;
    }

    const jsonResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `Extract the places from the following text and format them as a JSON array. 
      Text: ${groundedText}
      
      For each place, include:
      - placeId (generate a unique string if not available)
      - name
      - category
      - address
      - distanceMiles (number)
      - isOpen (boolean)
      - openStatusText (e.g., "Open now", "Closes soon", "Closed")
      - rating (number)
      - confidenceLabel (one of: "Highly reliable", "Likely open", "Hours may vary", "Call to confirm")
      - recommendationReason (short string)
      - lat (number, approximate based on location if needed)
      - lng (number, approximate based on location if needed)
      - phone (string, optional)
      - website (string, optional)
      - weeklyHours (array of strings, optional)
      - is247 (boolean, true if the place is open 24 hours a day, 7 days a week)
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              placeId: { type: Type.STRING },
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              address: { type: Type.STRING },
              distanceMiles: { type: Type.NUMBER },
              isOpen: { type: Type.BOOLEAN },
              openStatusText: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              confidenceLabel: { type: Type.STRING },
              recommendationReason: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              phone: { type: Type.STRING },
              website: { type: Type.STRING },
              weeklyHours: { type: Type.ARRAY, items: { type: Type.STRING } },
              is247: { type: Type.BOOLEAN }
            },
            required: ["placeId", "name", "category", "address", "distanceMiles", "isOpen", "openStatusText", "confidenceLabel", "lat", "lng"]
          }
        }
      }
    });

    let jsonStr = jsonResponse.text || '[]';
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    jsonStr = jsonMatch ? jsonMatch[0] : '[]';
    console.log("Extracted Places JSON:", jsonStr);
    const places = JSON.parse(jsonStr);
    const sortedPlaces = places.sort((a: any, b: any) => {
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;
      return a.distanceMiles - b.distanceMiles;
    });
    
    res.json(sortedPlaces);
  } catch (error) {
    console.error("Error searching places:", error);
    res.json([]);
  }
});

// Proxy route for searching events
app.post("/api/searchEvents", async (req, res) => {
  const { query, lat, lng, timeframe = 'today', address = '' } = req.body;
  if (!query || lat == null || lng == null) {
     res.status(400).json({ error: "Missing required parameters" });
     return;
  }

  try {
    const locationStr = address && address !== 'Current Location' && address !== 'Locating...' ? address : `latitude ${lat}, longitude ${lng}`;
    const groundedResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for events happening ${timeframe} near ${locationStr}. The user's query is: "${query}". Search the web for local events, concerts, festivals, or activities happening in this area ${timeframe}. Provide a detailed list of events including their name, location, time, and a brief description.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const groundedText = groundedResponse.text || '';
    
    if (!groundedText || groundedText.trim() === '') {
      console.log("No events found from Google Search");
      res.json([]);
      return;
    }

    const jsonResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `Extract the events from the following text and format them as a JSON array. 
      Text: ${groundedText}
      
      For each event, map it to the following place schema:
      - placeId (generate a unique string)
      - name (event name)
      - category (e.g., "Event", "Concert", "Festival")
      - address (event location/address)
      - distanceMiles (number, estimate if not provided, e.g., 5.0)
      - isOpen (boolean, always set to true so it shows up)
      - openStatusText (e.g., "Starts at 7 PM", "Happening now")
      - rating (number, use 0 if not applicable)
      - confidenceLabel (e.g., "Confirmed Event", "Check website")
      - recommendationReason (short description of the event)
      - lat (number, approximate based on location if needed, use ${lat} if unknown)
      - lng (number, approximate based on location if needed, use ${lng} if unknown)
      - website (string, optional, link to event if available)
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              placeId: { type: Type.STRING },
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              address: { type: Type.STRING },
              distanceMiles: { type: Type.NUMBER },
              isOpen: { type: Type.BOOLEAN },
              openStatusText: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              confidenceLabel: { type: Type.STRING },
              recommendationReason: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              website: { type: Type.STRING }
            },
            required: ["placeId", "name", "category", "address", "distanceMiles", "isOpen", "openStatusText", "confidenceLabel", "lat", "lng"]
          }
        }
      }
    });

    let jsonStr = jsonResponse.text || '[]';
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    jsonStr = jsonMatch ? jsonMatch[0] : '[]';
    console.log("Extracted Events JSON:", jsonStr);
    res.json(JSON.parse(jsonStr));
  } catch (error) {
    console.error("Error searching events:", error);
    res.json([]);
  }
});

// Voice processing wrapper over searchPlaces
app.post("/api/voiceQuery", async (req, res) => {
  const { query, lat, lng } = req.body;
  if (!query || lat == null || lng == null) {
      res.status(400).json({ error: "Missing required parameters" });
      return;
  }
  
  try {
    // Re-use internal logic (simplified here just redirecting to internal path, but we can do it inline or copy the logic)
    // For now we will just make it a local proxy to our own route or just simulate what the old code did
    const placesRes = await fetch(`http://localhost:${PORT}/api/searchPlaces`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ query, lat, lng })
    });
    const places = await placesRes.json();
    
    let responseText = "Sorry, I couldn't find any places matching your request.";
    if (places.length > 0) {
      const topPlace = places[0];
      responseText = `The best nearby option is ${topPlace.name}, ${topPlace.distanceMiles.toFixed(1)} miles away. It is ${topPlace.openStatusText.toLowerCase()}.`;
    }
    
    res.json({ responseText, places });
  } catch(error) {
    console.error("Error voice query:", error);
    res.json({ responseText: "Sorry, there was an error processing your request.", places: [] });
  }
});

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
  });
}

startServer();
