
import { GoogleGenAI } from "@google/genai";

// FIX: The API key must be obtained exclusively from the environment variable `process.env.API_KEY`.
// It is assumed to be pre-configured and accessible. Do not add checks for its existence.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';
const systemInstruction = "You are an expert construction cost estimator and project manager. Provide concise, helpful, and accurate information related to construction, materials, and project planning. Format your answers clearly, using markdown for lists, bolding, and italics where appropriate.";

export const getAIInsight = async (query: string): Promise<string> => {
  // FIX: Removed API key check as it's assumed to be present in the environment.
  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: query,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            topP: 1,
            topK: 32,
        },
    });

    // FIX: Accessing the `text` property directly is the correct way to get the response text.
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to fetch response from Gemini.");
  }
};
