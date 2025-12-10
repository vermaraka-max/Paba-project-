import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { Question, UserAnswer, QuizResult, LiteracyLevel } from "../types";
import { getCustomQuestions } from "./storageService";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Helper for safe JSON parsing
const parseJSON = (text: string | undefined, fallback: any = {}) => {
  if (!text) return fallback;
  try {
    // Remove markdown code blocks if present (common cause of syntax errors)
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return fallback;
  }
};

// Schema for generating questions
const questionsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING, description: "The question regarding online scams or password security." },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING }
              },
              required: ["id", "text"]
            }
          }
        },
        required: ["id", "text", "options"]
      }
    }
  },
  required: ["questions"]
};

// Schema for evaluating the result
const evaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    level: {
      type: Type.STRING,
      enum: [LiteracyLevel.NEW, LiteracyLevel.INTERMEDIATE, LiteracyLevel.EXPERIENCED, LiteracyLevel.MASTER],
      description: "The calculated digital literacy level based on answers."
    },
    feedback: {
      type: Type.STRING,
      description: "A helpful, encouraging paragraph explaining why they got this level and 1 tip to improve."
    },
    score: {
      type: Type.INTEGER,
      description: "A numerical score from 0 to 100 representing their performance."
    }
  },
  required: ["level", "feedback", "score"]
};

export const generateQuizQuestions = async (): Promise<Question[]> => {
  // 1. Get Custom Questions First
  const customQuestions = getCustomQuestions();
  
  // If we have enough custom questions (e.g., 3 or more), just use them to save API calls and ensure admin content is seen.
  if (customQuestions.length >= 3) {
    // Shuffle and return 3
    return customQuestions.sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  // 2. Otherwise, generate the difference
  const needed = 3 - customQuestions.length;
  
  try {
    const prompt = `
      Generate ${needed} distinct multiple-choice questions to assess a user's digital literacy regarding:
      1. Phishing/Online Scams
      2. Password Security/Strength
      3. General Data Privacy
      
      The questions should be practical scenarios (e.g., "You receive an email...").
      Provide 3 options for each question. One option should be clearly the safest/best practice, one mostly okay but flawed, and one dangerous.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionsSchema,
        temperature: 0.7,
      },
    });

    const data = parseJSON(response.text);
    
    let generatedQs: Question[] = [];
    if (data.questions && Array.isArray(data.questions)) {
      generatedQs = data.questions;
    } else {
        // Fallback if schema fails
        throw new Error("Invalid schema");
    }

    // Combine custom and generated
    return [...customQuestions, ...generatedQs];

  } catch (error) {
    console.error("Error generating quiz:", error);
    
    // Fallback: If API fails, return custom questions + hardcoded backups
    const backups = [
      {
        id: "backup-1",
        text: "You receive an email from 'Netflix Support' claiming your payment failed. It asks you to click a link to update card details. What do you do?",
        options: [
          { id: "a", text: "Click the link immediately to avoid service interruption." },
          { id: "b", text: "Check the sender's email address carefully and log in via the official Netflix app instead of the link." },
          { id: "c", text: "Reply to the email asking if it is real." }
        ]
      },
      {
        id: "backup-2",
        text: "Which of the following is the strongest password?",
        options: [
          { id: "a", text: "Password123!" },
          { id: "b", text: "MyDogName1990" },
          { id: "c", text: "Tr0ub4dour&3" }
        ]
      },
      {
        id: "backup-3",
        text: "A pop-up appears saying your computer has a virus and you must call a number to fix it. You:",
        options: [
          { id: "a", text: "Call the number immediately." },
          { id: "b", text: "Close the browser window immediately and run a scan with your own antivirus software." },
          { id: "c", text: "Download the software the pop-up suggests." }
        ]
      }
    ];

    // Combine custom questions with enough backups to reach 3
    const combined: Question[] = [...customQuestions];
    for (const b of backups) {
        if (combined.length < 3) {
            combined.push(b);
        }
    }
    return combined;
  }
};

export const evaluateQuiz = async (answers: UserAnswer[]): Promise<QuizResult> => {
  try {
    const answersStr = JSON.stringify(answers);
    const prompt = `
      Evaluate the user's digital literacy based on these questions and their chosen answers:
      ${answersStr}

      Determine their level strictly as one of: New, Intermediate, Experienced, Master.
      - Master: All answers perfect, high security awareness.
      - Experienced: Mostly correct, good instincts.
      - Intermediate: Some mistakes, basic knowledge.
      - New: Dangerous choices, needs significant learning.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
        temperature: 0.5,
      },
    });

    const result = parseJSON(response.text);
    return result as QuizResult;

  } catch (error) {
    console.error("Error evaluating quiz:", error);
    return {
      level: LiteracyLevel.INTERMEDIATE,
      feedback: "We encountered an error analyzing your specific results, but practicing good password hygiene and being skeptical of unexpected emails is always a good idea!",
      score: 50
    };
  }
};

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: "You are a friendly and knowledgeable Digital Literacy Assistant. Your goal is to help users understand online safety, recognize scams, and secure their digital lives. Keep answers concise, practical, and easy to understand for beginners. You can also explain why certain passwords are weak or how to spot phishing.",
    }
  });
};

export interface ScamAnalysisResult {
  riskLevel: 'SAFE' | 'CAUTION' | 'DANGEROUS' | 'UNKNOWN';
  explanation: string;
  sources: { uri: string; title: string }[];
}

export const analyzeScamRisk = async (input: string): Promise<ScamAnalysisResult> => {
  try {
    const prompt = `
      Analyze the following input to determine if it is likely a scam, phishing attempt, or dangerous.
      Input: "${input}"

      Use Google Search to check if this phone number, URL, or text pattern has been reported as a scam.

      Format your response strictly as follows:
      Line 1: One of these exact words: SAFE, CAUTION, DANGEROUS, or UNKNOWN.
      Line 2 onwards: A concise explanation of why. If it's a known official number/link, say so. If it has reports of fraud, summarize them.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType and responseSchema are NOT allowed with googleSearch
      },
    });

    const text = response.text || "";
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim().toUpperCase().replace(/[^A-Z]/g, ''); // Clean potential punctuation
    
    let riskLevel: ScamAnalysisResult['riskLevel'] = 'UNKNOWN';
    if (firstLine.includes('SAFE')) riskLevel = 'SAFE';
    else if (firstLine.includes('DANGEROUS')) riskLevel = 'DANGEROUS';
    else if (firstLine.includes('CAUTION')) riskLevel = 'CAUTION';
    else if (firstLine.includes('SUSPICIOUS')) riskLevel = 'CAUTION'; // Handle synonym

    const explanation = lines.slice(1).join('\n').trim() || text;

    // Extract sources if available
    const sources: { uri: string; title: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({ uri: chunk.web.uri, title: chunk.web.title });
      }
    });

    return { riskLevel, explanation, sources };

  } catch (error) {
    console.error("Error analyzing scam:", error);
    return {
      riskLevel: 'UNKNOWN',
      explanation: "We couldn't verify this input right now. Please treat unknown links and numbers with extreme caution.",
      sources: []
    };
  }
};

export interface NewsAnalysisResult {
  credibility: 'REAL' | 'FAKE' | 'MISLEADING' | 'SATIRE' | 'UNCERTAIN';
  analysis: string;
  sources: { uri: string; title: string }[];
}

export const analyzeNews = async (input: string): Promise<NewsAnalysisResult> => {
  try {
    const prompt = `
      Analyze the following news text, headline, or claim to determine its credibility using Google Search.
      Input: "${input}"

      Use Google Search to find recent, authoritative sources (like major news outlets, fact-checking sites like Snopes, Reuters, AP, etc.) that confirm or debunk this.

      Format your response strictly as follows:
      Line 1: One of these exact words: REAL, FAKE, MISLEADING, SATIRE, or UNCERTAIN.
      Line 2 onwards: A clear explanation. If it's fake, explain why (e.g. "This is a known hoax debunked by..."). If it's real, summarize the context.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim().toUpperCase().replace(/[^A-Z]/g, '');
    
    let credibility: NewsAnalysisResult['credibility'] = 'UNCERTAIN';
    if (firstLine.includes('REAL')) credibility = 'REAL';
    else if (firstLine.includes('FAKE')) credibility = 'FAKE';
    else if (firstLine.includes('MISLEADING')) credibility = 'MISLEADING';
    else if (firstLine.includes('SATIRE')) credibility = 'SATIRE';

    const analysis = lines.slice(1).join('\n').trim() || text;

    const sources: { uri: string; title: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({ uri: chunk.web.uri, title: chunk.web.title });
      }
    });

    return { credibility, analysis, sources };

  } catch (error) {
    console.error("Error analyzing news:", error);
    return {
      credibility: 'UNCERTAIN',
      analysis: "We couldn't verify this claim right now. Always check multiple trusted sources.",
      sources: []
    };
  }
};

export interface ScreenTimeAnalysis {
  valid: boolean;
  hours: number;
}

export const analyzeScreenTimeScreenshot = async (base64Image: string): Promise<ScreenTimeAnalysis> => {
  try {
    const prompt = `
      Analyze this image. Does it look like a "Screen Time" or "Digital Wellbeing" dashboard screenshot?
      If YES, extract the total daily screen time shown (convert hours and minutes to a decimal number, e.g., 2h 30m = 2.5).
      If NO, set valid to false.
    `;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN },
            hours: { type: Type.NUMBER, description: "Total hours in decimal format (e.g. 2.5)" }
          },
          required: ["valid", "hours"]
        }
      }
    });

    return parseJSON(response.text, { valid: false, hours: 0 });
  } catch (error) {
    console.error("Screen time analysis error:", error);
    return { valid: false, hours: 0 };
  }
};