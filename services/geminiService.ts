
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateWikiArticle = async (topic: string): Promise<string> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    You are an encyclopedist creating a page for an 'Infinite Wiki'. Your task is to write a clear, concise, and informative article about the topic: "${topic}".

    Follow these rules strictly:
    1.  The article should be well-structured, easy to understand, and neutral in tone.
    2.  Identify 5 to 7 key related concepts, terms, or entities within your explanation.
    3.  Wrap each of these identified key terms *exactly* in double square brackets, like [[this]]. The terms inside the brackets must be in the same language as the topic "${topic}". For example, if writing in Spanish about "Sistema Solar", you might include terms like [[Sol]], [[Planeta]], and [[Júpiter]].
    4.  Do not use any markdown formatting (no headings, bold text, lists, etc.). Write the content as a single block of text with paragraphs.
    5.  Begin the article directly without any introductory phrases like "Here is an article about..." or "This article will discuss...".
    6.  Ensure the response is only the article text itself.
    `;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    throw new Error("Failed to fetch article from AI service.");
  }
};