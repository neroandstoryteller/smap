import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { env } from '$env/dynamic/private';

// Configure and export the Genkit instance
export const ai = genkit({
	plugins: [
		googleAI({
			// Use the dynamic env variable.
			// Make sure you have AI_API_KEY in your .env file.
			apiKey: env.AI_API_KEY
		})
	],
	logSinks: [],
	enableTracingAndMetrics: true
});

// Export the embedder reference separately for convenience
export const textEmbedding = googleAI.embedder('embedding-001');
