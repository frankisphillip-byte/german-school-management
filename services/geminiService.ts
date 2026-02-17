
import { GoogleGenAI } from "@google/genai";
import { CEFRLevel } from "../types";

// Always initialize the client with an object containing the apiKey.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using the high-quality thinking model for complex school management and pedagogical tasks
const MODEL_NAME = 'gemini-3-pro-preview';
const THINKING_BUDGET = 32768; // Maximum budget for Gemini 3 Pro

/**
 * Handles complex strategic queries using the thinking-enabled Pro model.
 */
export const generateThinkingResponse = async (prompt: string, context?: string) => {
  try {
    const contents = context ? `Context: ${context}\n\nUser Query: ${prompt}` : prompt;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        thinkingConfig: { thinkingBudget: THINKING_BUDGET }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Thinking Model Error:", error);
    return "Die komplexe Analyse konnte nicht abgeschlossen werden. Bitte versuchen Sie es später erneut.";
  }
};

/**
 * Provides deep pedagogical feedback using the Pro model with thinking enabled.
 */
export const getGradingFeedback = async (grade: number, cefrLevel: CEFRLevel, topic: string) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `As an expert German language teacher at DSB Brooklyn, provide constructive and deep pedagogical feedback in German for a student at level ${cefrLevel} who received a German grade of ${grade.toFixed(1)} (1.0 is best, 5.0 is fail) on the topic: ${topic}. Use your thinking capability to provide insightful suggestions beyond simple correction.`,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Feedback konnte momentan nicht generiert werden.";
  }
};

/**
 * Generates curriculum descriptions using the high-quality Pro model.
 */
export const generateCourseDescription = async (courseName: string, level: CEFRLevel) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Create a professional and enticing course description in German (approx 40 words) for a high-standard language course named "${courseName}" designed for the CEFR ${level} level. Focus on strategic learning outcomes.`,
      config: {
        thinkingConfig: { thinkingBudget: 8192 } // Moderate thinking for descriptions
      }
    });
    return response.text;
  } catch (error) {
    return "Ein spannender Kurs für Deutschlernende auf diesem Niveau.";
  }
};

/**
 * Analyzes overall class progress with deep pedagogical insights.
 */
export const analyzeClassProgress = async (grades: number[]) => {
    const avg = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyze this list of German school grades (1.0-5.0 scale): ${grades.join(', ')}. The class average is ${avg.toFixed(2)}. Provide a deep pedagogical insight in English for the teacher about class performance trends and potential interventions.`,
        config: {
            thinkingConfig: { thinkingBudget: THINKING_BUDGET }
        }
      });
      return response.text;
    } catch (error) {
      return "Unable to analyze class data.";
    }
}
