const genAI = require('../config/gemini');
const { buildChatSystemPrompt } = require('./promptTemplates');

/**
 * Sanitizes chat history so it conforms to GoogleGenerativeAI rules:
 * 1. Must start with a 'user' turn.
 * 2. Consecutive turns with the same role are merged.
 */
function sanitizeHistory(rawHistory = []) {
  if (!rawHistory || rawHistory.length === 0) return [];

  const formatted = [];

  for (const turn of rawHistory) {
    const role = turn.sender === 'user' ? 'user' : 'model';
    const text = (turn.text || '').trim();

    if (!text) continue;

    // Rule 1: Gemini history MUST start with 'user'. Drop any leading 'model' messages.
    if (formatted.length === 0 && role !== 'user') {
      continue;
    }

    // Rule 2: Consecutive identical roles are not allowed. Merge text if same role repeats.
    if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
      formatted[formatted.length - 1].parts[0].text += `\n${text}`;
    } else {
      formatted.push({
        role,
        parts: [{ text }]
      });
    }
  }

  return formatted;
}

/**
 * Generates an AI conversational response using Gemini
 */
async function generateChatResponse({
  userMessage,
  history = [],
  personality = 'friend',
  contextType = 'casual',
  weaknessRules = [],
  userProficiency = 'intermediate'
}) {
  const systemInstruction = buildChatSystemPrompt({
    personality,
    contextType,
    weaknessRules,
    userProficiency
  });

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 800
      }
    });

    // Sanitize and trim history to conform to Gemini API contracts
    const formattedHistory = sanitizeHistory(history.slice(-14));

    const chat = model.startChat({
      history: formattedHistory
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const aiText = response.text() ? response.text().trim() : '';

    if (!aiText) {
      return "I'm listening closely! Could you elaborate a bit more on that?";
    }

    return aiText;
  } catch (error) {
    console.error('[Gemini Chat Service Error]:', error.message);
    throw new Error('Failed to generate AI response. Please check API key and connectivity.');
  }
}

module.exports = {
  generateChatResponse
};