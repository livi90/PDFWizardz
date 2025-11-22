import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AiResponseSchema, Language, DocumentContext, QuizQuestion, FlashcardItem, PresentationStructure } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestedName: {
      type: Type.STRING,
      description: "A clean filename ending in .pdf. Format: YYYY-MM-DD_Entity_Category.pdf",
    },
    date: {
      type: Type.STRING,
      description: "The primary date found in the document (YYYY-MM-DD).",
    },
    entity: {
      type: Type.STRING,
      description: "The company, person, or organization the document belongs to.",
    },
    category: {
      type: Type.STRING,
      description: "Invoice, Contract, Receipt, Report, Manual, etc.",
    },
    summary: {
      type: Type.STRING,
      description: "A very brief 1-sentence summary of content.",
    }
  },
  required: ["suggestedName", "date", "entity", "category", "summary"],
};

export const analyzePdfContent = async (
  text: string, 
  originalFilename: string, 
  lang: Language, 
  context: DocumentContext
): Promise<AiResponseSchema> => {
  try {
    let contextInstruction = "";
    if (context === 'FINANCE') contextInstruction = "Focus deeply on Invoice Numbers, Amounts, and financial dates. Filename should look like: YYYY-MM-DD_Entity_InvoiceNum.pdf";
    if (context === 'LEGAL') contextInstruction = "Focus on Parties involved and Contract Type. Filename should look like: YYYY-MM-DD_ContractType_Parties.pdf";
    if (context === 'EDUCATION') contextInstruction = "Focus on Subject, Topic, and Chapter. Filename should look like: Subject_Topic_Date.pdf";
    
    const prompt = `
    You are an expert file organizer. Analyze the text content of this PDF file.
    Original Filename: ${originalFilename}
    Target Language: ${lang} (Output the Summary and Category in ${lang}, but keep the Filename format standard ASCII if possible).
    
    Context: ${contextInstruction}

    Document Text Context:
    ${text.substring(0, 10000)} 
    
    Instructions:
    1. Identify the document date. If none, use today.
    2. Identify the entity (sender/creator).
    3. Categorize the document (In ${lang}).
    4. Create a standardized filename.
    5. Provide a short summary (In ${lang}).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AiResponseSchema;
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// --- STUDY FEATURES ---

const quizSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      answerIndex: { type: Type.INTEGER, description: "Index (0-3) of the correct option" }
    },
    required: ["question", "options", "answerIndex"]
  }
};

const flashcardSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      front: { type: Type.STRING, description: "The concept or question" },
      back: { type: Type.STRING, description: "The definition or answer" }
    },
    required: ["front", "back"]
  }
};

export const generateQuiz = async (text: string, lang: Language): Promise<QuizQuestion[]> => {
  try {
    const prompt = `
    Generate 10 challenging multiple-choice questions based on the following text.
    Target Language: ${lang}.
    Format: JSON Array.
    Text: ${text.substring(0, 15000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizQuestion[];
    }
    throw new Error("Failed to generate quiz");
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    throw error;
  }
};

export const generateFlashcards = async (text: string, lang: Language): Promise<FlashcardItem[]> => {
  try {
    const prompt = `
    Generate 12 key concept flashcards (Front: Term/Question, Back: Definition/Answer) based on the text.
    Target Language: ${lang}.
    Format: JSON Array.
    Text: ${text.substring(0, 15000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: flashcardSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as FlashcardItem[];
    }
    throw new Error("Failed to generate flashcards");
  } catch (error) {
    console.error("Gemini Flashcard Error:", error);
    throw error;
  }
};

// --- PRESENTATION FEATURES ---

const pptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    mainTitle: { type: Type.STRING, description: "Catchy title for the presentation" },
    subtitle: { type: Type.STRING, description: "Subtitle or tagline" },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Slide Title" },
          bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 concise bullet points" },
          speakerNotes: { type: Type.STRING, description: "Detailed notes for the speaker to say" }
        },
        required: ["title", "bulletPoints", "speakerNotes"]
      }
    }
  },
  required: ["mainTitle", "subtitle", "slides"]
};

export const generatePresentationData = async (text: string, lang: Language): Promise<PresentationStructure> => {
  try {
    const prompt = `
    Act as a Presentation Designer. Create a structure for a PowerPoint presentation based on the document text.
    The presentation should summarize the key points effectively.
    Target Language: ${lang}.
    Limit: 5-8 Slides.
    Format: JSON.
    Text: ${text.substring(0, 20000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pptSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as PresentationStructure;
    }
    throw new Error("Failed to generate presentation structure");
  } catch (error) {
    console.error("Gemini PPT Error:", error);
    throw error;
  }
};