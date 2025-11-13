import { GoogleGenAI, Type, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const textModel = "gemini-2.5-flash";
const imageModel = "gemini-2.5-flash-image";

export const generateWikiArticle = async (topic: string): Promise<string> => {
  const prompt = `
    You are an encyclopedist creating a page for an 'Infinite Wiki'. Your task is to write a clear, concise, and informative article using Markdown about the topic: "${topic}".

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


export const generateSimpleExplanation = async (topic: string, articleContent: string): Promise<string> => {
    const prompt = `Based on the following article about "${topic}", explain it in simple terms, as if you were talking to a curious 10-year-old. Focus on the main ideas and avoid jargon.\n\nArticle:\n${articleContent}`;
    try {
        const response = await ai.models.generateContent({ model: textModel, contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating simple explanation:", error);
        throw new Error("Failed to generate simple explanation.");
    }
};

export const generateAnalogy = async (topic: string, articleContent: string): Promise<string> => {
    const prompt = `Based on the following article about "${topic}", create a compelling and easy-to-understand analogy to explain the core concept. Introduce the analogy and then briefly explain how it connects to the topic.\n\nArticle:\n${articleContent}`;
    try {
        const response = await ai.models.generateContent({ model: textModel, contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating analogy:", error);
        throw new Error("Failed to generate analogy.");
    }
};

export interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
}

const quizSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: {
          type: Type.STRING,
          description: 'The question text.',
        },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'An array of 4 possible answers.',
        },
        answer: {
          type: Type.STRING,
          description: 'The correct answer, which must be one of the strings from the options array.',
        },
      },
      required: ['question', 'options', 'answer'],
    },
};

export const generateQuiz = async (topic: string, articleContent: string): Promise<QuizQuestion[]> => {
    const prompt = `Based on the following article about "${topic}", create a 3-question multiple-choice quiz to test understanding of the key concepts. Each question must have exactly 4 options. The 'answer' field must exactly match one of the strings in the 'options' array.\n\nArticle:\n${articleContent}`;
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizSchema,
            },
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("Failed to generate quiz.");
    }
};


export const generateImageForTopic = async (topic: string): Promise<string> => {
    const prompt = `A visually stunning and artistic digital painting representing the concept of '${topic}'. Abstract, vibrant colors, minimalist style, evocative and conceptual.`;
    try {
        const response = await ai.models.generateContent({
            model: imageModel,
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No image data found in response.");

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image for topic.");
    }
};
