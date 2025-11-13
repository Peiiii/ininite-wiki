import { GoogleGenAI, Type } from "@google/genai";

// Fix: Export QuizQuestion interface
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const textModel = "gemini-flash-lite-latest";

export const generateWikiArticle = async (topic: string): Promise<string> => {
  const prompt = `
    You are an encyclopedist creating a page for an 'Infinite Wiki'. Your task is to write a clear, concise, and informative article using Markdown about the topic: "${topic}".

    The article must be written in the same language as the topic.

    The article should be well-structured, easy to understand, and neutral in tone. Format it into clear paragraphs and use standard Markdown for formatting like headings or lists where it improves clarity. Begin the article directly without any introductory phrases. Ensure the response is only the article text itself.
    `;

  try {
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    throw new Error("Failed to fetch article from AI service.");
  }
};

export const generateRelatedTopics = async (textSelection: string): Promise<string[]> => {
  const prompt = `Analyze the following text selection and identify its language. Then, generate 3 to 4 related topics for further exploration.

Rules:
1. The topics must be concise keywords or short phrases, not complete sentences.
2. The topics must be in the exact same language as the original text selection.

Text Selection: "${textSelection}"

Return ONLY a valid JSON array of strings, with nothing before or after it. For example: ["Keyword 1", "Related Concept", "Another Topic"]`;

  try {
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                },
            },
        },
    });
    const jsonText = response.text.trim();
    const topics = JSON.parse(jsonText);
    return Array.isArray(topics) ? topics.filter(t => typeof t === 'string') : [];
  } catch (error) {
    console.error("Error generating related topics:", error);
    // On failure, return an empty array to not break the UI
    return [];
  }
};