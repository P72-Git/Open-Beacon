import { PlaceResult } from '../types';

export async function searchPlaces(query: string, lat: number, lng: number): Promise<PlaceResult[]> {
  try {
    const res = await fetch('/api/searchPlaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, lat, lng })
    });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
}

export async function searchEvents(query: string, lat: number, lng: number, timeframe: string = 'today', address: string = ''): Promise<PlaceResult[]> {
  try {
    const res = await fetch('/api/searchEvents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, lat, lng, timeframe, address })
    });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (error) {
    console.error("Error searching events:", error);
    return [];
  }
}

export async function processVoiceTextQuery(query: string, lat: number, lng: number): Promise<{ responseText: string, places: PlaceResult[] }> {
  try {
    const res = await fetch('/api/voiceQuery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, lat, lng })
    });
    if (!res.ok) throw new Error('Network response was not ok');
    return await res.json();
  } catch (error) {
    console.error("Error processing voice text query:", error);
    return { responseText: "Sorry, there was an error processing your request.", places: [] };
  }
}

