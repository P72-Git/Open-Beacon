import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  const groundedText = `Today, Wednesday, April 15, 2026, Philadelphia is hosting a diverse array of activities ranging from major arena concerts and NBA post-season basketball to community celebrations and local theater previews.

### **Major Concerts & Music**
*   **Lewis Capaldi**
    *   **Location:** The Liacouras Center (1776 N Broad St)
    *   **Time:** 7:30 PM
    *   **Description:** The beloved Scottish singer-songwriter returns to Philadelphia for a heartfelt performance featuring hits from his latest EP and fan favorites like "Someone You Loved."
*   **The Last Dinner Party**
    *   **Location:** Franklin Music Hall (421 N 7th St)
    *   **Time:** 8:00 PM
    *   **Description:** Known for their theatrical and atmospheric indie-rock, this breakout band brings their "From The Pyre" tour to the city for a night of elegant and high-energy music.
*   **The Wonder Years**
    *   **Location:** Theatre of Living Arts (334 South St)
    *   **Time:** 7:00 PM
    *   **Description:** A hometown show for this legendary pop-punk band, likely performing to a high-energy, sold-out crowd.
*   **WKDU Presents: Field Medic**
    *   **Location:** Johnny Brenda’s (1201 Frankford Ave)
    *   **Time:** 8:00 PM
    *   **Description:** An intimate night of lo-fi folk and indie-pop hosted by Drexel University's student-run radio station.`;
  
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
    - lat (number, approximate based on location if needed, use 39.9526 if unknown)
    - lng (number, approximate based on location if needed, use -75.1652 if unknown)
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

  console.log(jsonResponse.text);
}
test();
