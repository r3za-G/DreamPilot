import OpenAI from 'openai';

// Get API key from environment variable
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

if (!OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY not set in environment variables');
}

export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// API configuration
export const OPENAI_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 500,
};
