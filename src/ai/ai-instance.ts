import {genkit} from 'genkit';
import { googleAI, gemini } from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: gemini('gemini-1.5-flash'),
});
