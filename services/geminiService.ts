import { GoogleGenAI } from "@google/genai";
import type { GrammarFeedback } from '../types';

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function checkGrammar(sentence: string, word: string): Promise<GrammarFeedback> {
  const prompt = `
    You are an expert English grammar assistant. Your task is to analyze a sentence written by a user who is trying to practice using a specific vocabulary word. Provide concise, clear, and constructive feedback. The user is a language learner, so be encouraging.

    Analyze the grammar of the following sentence. The user was asked to use the word "${word}".

    Sentence: "${sentence}"

    Respond ONLY in JSON format with the following structure:
    {
      "isCorrect": boolean, // Is the sentence grammatically correct and does it use the word appropriately?
      "feedback": string, // A short, one-sentence feedback message. If correct, say "Great job!". If incorrect, explain the main error simply.
      "correctedSentence": string // If the sentence is incorrect, provide a corrected version. If it's correct, return the original sentence.
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });
    
    const text = response.text;
    if (text === undefined) {
      throw new Error("The response from the model did not contain any text.");
    }

    let jsonStr = text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);
    return parsedData as GrammarFeedback;

  } catch (error) {
    console.error("Error checking grammar:", error);
    return {
      isCorrect: false,
      feedback: "Sorry, I couldn't analyze the sentence. The AI service might be unavailable.",
      correctedSentence: sentence,
    };
  }
}