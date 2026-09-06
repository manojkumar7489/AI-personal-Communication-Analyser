const genAI = require('../config/gemini');
const { cleanAndParseJSON } = require('../utils/jsonParser');
const { SESSION_ANALYSIS_PROMPT, RETRY_COMPARISON_PROMPT } = require('./promptTemplates');

const DEFAULT_ANALYSIS_FALLBACK = {
  overallScore: 70,
  grammar: 70,
  fluency: 70,
  vocabulary: 70,
  clarity: 70,
  confidence: 70,
  structure: 70,
  strengths: ['Clear conversational participation', 'Expressed core idea directly'],
  weaknesses: ['Add more descriptive details', 'Reduce reliance on filler phrases'],
  importantMistakes: [],
  betterApproach: 'Focus on structuring your thoughts with a clear beginning, middle example, and a firm concluding sentence.',
  detectedFillers: [],
  structuralHabitObserved: 'none',
  retryRecommended: true,
  nextFocus: 'Conclude answers cleanly with one key takeaway'
};

/**
 * Analyzes a communication practice session or transcript
 */
async function analyzeCommunicationSession({ transcript, contextType = 'casual', targetRole = 'general' }) {
  const prompt = `COMMUNICATION TRANSCRIPT TO EVALUATE:
Context: ${contextType}
Target Role/Proficiency: ${targetRole}

TRANSCRIPT:
"""
${transcript}
"""

Evaluate this communication transcript against the criteria. Return JSON only.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: SESSION_ANALYSIS_PROMPT,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parsed = cleanAndParseJSON(response.text(), DEFAULT_ANALYSIS_FALLBACK);

    parsed.overallScore = Math.max(0, Math.min(100, Number(parsed.overallScore) || 70));
    parsed.grammar = Math.max(0, Math.min(100, Number(parsed.grammar) || 70));
    parsed.fluency = Math.max(0, Math.min(100, Number(parsed.fluency) || 70));
    parsed.vocabulary = Math.max(0, Math.min(100, Number(parsed.vocabulary) || 70));
    parsed.clarity = Math.max(0, Math.min(100, Number(parsed.clarity) || 70));
    parsed.confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 70));
    parsed.structure = Math.max(0, Math.min(100, Number(parsed.structure) || 70));

    return parsed;
  } catch (error) {
    console.error('[Gemini Analysis Service Error]:', error.message);
    return DEFAULT_ANALYSIS_FALLBACK;
  }
}

/**
 * Compares two retry attempts to calculate delta improvements
 */
async function compareRetryAttempts({ originalText, newText, previousScore = 65 }) {
  const prompt = `PREVIOUS ATTEMPT:
"""
${originalText}
"""
Previous Score: ${previousScore}

NEW ATTEMPT:
"""
${newText}
"""

Compare both attempts. Highlight what improved, calculate score delta, and identify any remaining weaknesses. Return JSON only.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: RETRY_COMPARISON_PROMPT,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const fallbackComparison = {
      newOverallScore: Math.min(100, previousScore + 8),
      scoreDelta: 8,
      strengthsInNewAttempt: ['Noticeable increase in clarity', 'More deliberate word choices'],
      remainingWeaknesses: ['Can still add a stronger closing summary'],
      improvementSummary: 'The second attempt showed greater focus and fewer disjointed ideas.',
      detailedDeltas: { clarity: 'improved', structure: 'improved', conciseness: 'same' }
    };

    return cleanAndParseJSON(response.text(), fallbackComparison);
  } catch (error) {
    console.error('[Gemini Retry Comparison Error]:', error.message);
    return {
      newOverallScore: previousScore + 5,
      scoreDelta: 5,
      strengthsInNewAttempt: ['Good effort on retrying'],
      remainingWeaknesses: ['Continue practicing conciseness'],
      improvementSummary: 'You delivered the idea with slightly more confidence on the second round.',
      detailedDeltas: { clarity: 'improved', structure: 'same', conciseness: 'same' }
    };
  }
}

/**
 * Analyzes storytelling submissions specifically on narrative arc and engagement
 */
async function analyzeStorytelling({ promptTopic, storyText }) {
  const prompt = `STORYTELLING TOPIC: "${promptTopic}"
USER'S STORY:
"""
${storyText}
"""

Evaluate this narrative. Assess Beginning (hook), Flow/Sequence, Clarity, Sensory Vocabulary, Grammar, and Emotional Engagement.
Respond with JSON matching this schema:
{
  "storyScore": <number 0-100>,
  "breakdown": {
    "structure": <number 0-100>,
    "clarity": <number 0-100>,
    "fluency": <number 0-100>,
    "vocabulary": <number 0-100>,
    "grammar": <number 0-100>,
    "engagement": <number 0-100>
  },
  "strengths": [<string>, <string>],
  "improvements": [<string>, <string>],
  "betterStructure": "<step-by-step 3-bullet blueprint to tell this story more powerfully>"
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const fallbackStory = {
      storyScore: 72,
      breakdown: { structure: 70, clarity: 75, fluency: 72, vocabulary: 68, grammar: 74, engagement: 73 },
      strengths: ['Good chronological flow', 'Clear emotional core'],
      improvements: ['Open with a vivid sensory detail', 'Avoid rushing through the climax'],
      betterStructure: '1. Hook with the moment of highest tension\n2. Share the background and key dilemma\n3. Conclude with what you learned'
    };

    return cleanAndParseJSON(response.text(), fallbackStory);
  } catch (error) {
    console.error('[Gemini Story Analysis Error]:', error.message);
    return {
      storyScore: 70,
      breakdown: { structure: 70, clarity: 70, fluency: 70, vocabulary: 70, grammar: 70, engagement: 70 },
      strengths: ['Story followed a clear timeline'],
      improvements: ['Add more detail to the climax'],
      betterStructure: '1. The Hook\n2. The Problem\n3. The Takeaway'
    };
  }
}

module.exports = {
  analyzeCommunicationSession,
  compareRetryAttempts,
  analyzeStorytelling
};