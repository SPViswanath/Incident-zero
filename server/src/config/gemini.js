import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// Ensure the API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error("CRITICAL: GEMINI_API_KEY is not set in your .env file!");
}

// Initialize the new @google/genai SDK
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
