import { GoogleGenerativeAI } from "@google/generative-ai";
import { Coin } from '../types';

// Initialize Gemini
// Note: In a production app, the key should come from a secure backend proxy or be input by the user.
// Since we are simulating the client environment, we use process.env.GEMINI_API_KEY.
// @ts-ignore - Vite injects these
const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getMarketInsight = async (coins: Coin[]): Promise<string> => {
  if (!genAI || !apiKey) {
    return "กรุณาใส่ API Key ของ Gemini เพื่อใช้งานฟีเจอร์นี้ (Please configure GEMINI_API_KEY in .env.local).";
  }

  try {
    const coinSummary = coins.map(c => 
      `${c.symbol}: ${c.price} THB (${c.change24h > 0 ? '+' : ''}${c.change24h}%)`
    ).join('\n');

    const prompt = `
      Analyze the following crypto market snapshot for a Thai user.
      Keep it brief, encouraging, and professional.
      Language: Thai (ภาษาไทย).
      Max length: 2 sentences.
      
      Data:
      ${coinSummary}
    `;

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาตรวจสอบ API Key";
  }
};