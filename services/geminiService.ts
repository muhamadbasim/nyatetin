import { GoogleGenAI, Type } from "@google/genai";
import { ParsedTransactionData } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const parseTransactionWithGemini = async (text: string): Promise<ParsedTransactionData | null> => {
  if (!apiKey) {
    console.warn("API Key missing for Gemini");
    // Fallback or mock if no API key for demo purposes, 
    // but strictly adhering to instructions, we try to use the API.
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse this transaction text into JSON: "${text}". 
      If the currency is implied (e.g. "50k"), convert to full number.
      Classify 'type' as strictly 'income' or 'expense'.
      Infer a short 'category' (e.g., Food, Transport, Salary).
      Keep 'description' brief.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["income", "expense"] },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["amount", "type", "category", "description"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result as ParsedTransactionData;
  } catch (error) {
    console.error("Error parsing transaction with Gemini:", error);
    return null;
  }
};