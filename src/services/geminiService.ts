import { GoogleGenAI, Type } from '@google/genai';
import { PlaceResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function searchPlaces(query: string, lat: number, lng: number): Promise<PlaceResult[]> {
  try {
    // Step 1: Get grounded information using Maps tool
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
      return [];
    }

    // Step 2: Parse the grounded text into structured JSON using a fast model
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
    const places: PlaceResult[] = JSON.parse(jsonStr);
    return places.sort((a, b) => {
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;
      return a.distanceMiles - b.distanceMiles;
    });
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
}

export async function searchEvents(query: string, lat: number, lng: number, timeframe: string = 'today', address: string = ''): Promise<PlaceResult[]> {
  try {
    // Step 1: Get grounded information using Google Search tool
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
      return [];
    }

    // Step 2: Parse the grounded text into structured JSON
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
    const places: PlaceResult[] = JSON.parse(jsonStr);
    return places;
  } catch (error) {
    console.error("Error searching events:", error);
    return [];
  }
}

export async function processVoiceTextQuery(query: string, lat: number, lng: number): Promise<{ responseText: string, places: PlaceResult[] }> {
  try {
    // Step 1: Get places using the existing searchPlaces function
    const places = await searchPlaces(query, lat, lng);
    
    // Step 2: Generate a spoken summary
    let responseText = "Sorry, I couldn't find any places matching your request.";
    if (places.length > 0) {
      const topPlace = places[0];
      responseText = `The best nearby option is ${topPlace.name}, ${topPlace.distanceMiles.toFixed(1)} miles away. It is ${topPlace.openStatusText.toLowerCase()}.`;
    }

    return { responseText, places };
  } catch (error) {
    console.error("Error processing voice text query:", error);
    return { responseText: "Sorry, there was an error processing your request.", places: [] };
  }
}
