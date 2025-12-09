/// <reference types="vite/client" />
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Citation, SearchResult, Language } from "../types";

// Initialize Gemini Client
// Using Vite env var (standard) or process.env (legacy/fallback - handled safely)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY ||
  (typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined);

if (!apiKey) {
  console.error("Gemini API Key is missing! Please set VITE_GEMINI_API_KEY in Vercel Environment Variables.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key-to-prevent-crash" });

const SYSTEM_INSTRUCTION_EN = `You are a highly capable academic research assistant designed to help students and researchers. 
Your goal is to provide comprehensive, accurate, and well-structured answers to research questions. 
Always use a formal, academic tone. 
Structure your answer with clear headings. 
You have access to Google Search tools; use them to verify facts and find recent papers or articles.`;

const SYSTEM_INSTRUCTION_SI = `ඔබ සිසුන්ට සහ පර්යේෂකයන්ට උපකාර කිරීම සඳහා නිර්මාණය කර ඇති ඉහළ හැකියාවක් ඇති අධ්‍යයන පර්යේෂණ සහායකයෙකි.
ඔබගේ ඉලක්කය වන්නේ පර්යේෂණ ප්‍රශ්න සඳහා පුළුල්, නිවැරදි සහ මනාව ව්‍යුහගත පිළිතුරු සැපයීමයි.
සැමවිටම විධිමත්, ශාස්ත්‍රීය ස්වරයක් භාවිතා කරන්න.
පැහැදිලි මාතෘකා සහිතව ඔබේ පිළිතුර සකස් කරන්න.
ඔබට Google Search මෙවලම් වෙත ප්‍රවේශය ඇත; කරුණු තහවුරු කිරීමට සහ මෑත කාලීන ලිපි හෝ ලිපි සොයා ගැනීමට ඒවා භාවිතා කරන්න.
කරුණාකර ඔබේ පිළිතුර සිංහල භාෂාවෙන් ලබා දෙන්න.`;

export const performResearch = async (
  query: string,
  language: Language
): Promise<SearchResult> => {
  try {
    const modelId = 'gemini-2.5-flash'; // Using Flash for speed with search grounding

    const systemInstruction = language === 'si' ? SYSTEM_INSTRUCTION_SI : SYSTEM_INSTRUCTION_EN;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: query,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }], // Enable Google Search Grounding
        temperature: 0.3, // Lower temperature for more factual responses
      },
    });

    const text = response.text || "No response generated.";

    // Extract Grounding Metadata (Citations)
    // The SDK returns grounding chunks in candidates[0].groundingMetadata.groundingChunks
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const sources: Citation[] = [];

    groundingChunks.forEach((chunk, index) => {
      if (chunk.web) {
        sources.push({
          id: `src-${Date.now()}-${index}`,
          title: chunk.web.title || "Untitled Source",
          uri: chunk.web.uri || "#",
          source: "Google Search"
        });
      }
    });

    // Deduplicate sources based on URI
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return {
      text,
      sources: uniqueSources
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to perform research. Please check your connection and try again.");
  }
};
