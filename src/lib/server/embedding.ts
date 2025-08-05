import { ai, textEmbedding } from '$lib/server/genkit';
import type { Embedding } from '@genkit-ai/ai/embedding';

/**
 * Generates an embedding vector for the given content.
 * @param content The string content to embed.
 * @returns A promise that resolves to an array of numbers representing the embedding.
 */
export async function generateEmbedding(content: string): Promise<number[]> {
	if (!content || content.trim() === '') {
		console.warn('Attempted to generate embedding for empty content.');
		return [];
	}

	try {
		const embeddingResponse: Embedding[] = await ai.embed({
			embedder: textEmbedding,
			content: content
		});

		// Extract the numeric vector from the response object.
		if (embeddingResponse.length > 0 && embeddingResponse[0].embedding) {
			return embeddingResponse[0].embedding;
		}

		// Return an empty array if something went wrong
		return [];
	} catch (error: any) {
		console.error('Failed to generate embedding:', error);
		// Re-throw the error to be handled by the caller
		throw error;
	}
}
