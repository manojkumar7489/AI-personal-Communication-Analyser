/**
 * Utility to reliably extract JSON payloads from LLM responses
 * Handles raw JSON, backtick fences (```json ... ```), and trailing artifacts.
 */
function cleanAndParseJSON(rawText, fallback = {}) {
  if (!rawText || typeof rawText !== 'string') {
    return fallback;
  }

  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    cleaned = cleaned.trim();
  }

  // Attempt direct parse
  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    // Locate outermost JSON object boundaries
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extractedObject = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(extractedObject);
      } catch (nestedErr) {
        console.error('Failed to parse extracted JSON block:', nestedErr.message);
      }
    }

    // Locate outermost JSON array boundaries
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const extractedArray = cleaned.substring(firstBracket, lastBracket + 1);
      try {
        return JSON.parse(extractedArray);
      } catch (arrayErr) {
        console.error('Failed to parse extracted JSON array:', arrayErr.message);
      }
    }

    console.warn('JSON extraction fallback activated. Raw snippet:', cleaned.slice(0, 150));
    return fallback;
  }
}

module.exports = {
  cleanAndParseJSON
};