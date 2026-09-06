const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[Gemini Config] Warning: GEMINI_API_KEY is not defined in environment variables. AI operations will fail until provided.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY_FOR_INITIALIZATION');

module.exports = genAI;