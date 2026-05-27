import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  const groundedResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Search for events happening today near Philadelphia, PA. Provide a detailed list of events including their name, location, time, and a brief description.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  console.log(groundedResponse.text);
}
test();
