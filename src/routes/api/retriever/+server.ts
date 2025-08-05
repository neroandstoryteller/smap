// src/routes/api/retriever/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ai, textEmbedding } from '$lib/server/genkit';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getDb } from '$lib/database/firebase';
import type { ShapeData } from '$lib/models/shapes';

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
	if (!vecA || !vecB || vecA.length !== vecB.length) {
		return 0;
	}
	const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
	const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
	const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
	if (magA === 0 || magB === 0) {
		return 0;
	}
	const similarity = dotProduct / (magA * magB);
	return isNaN(similarity) ? 0 : similarity;
}

// Helper to extract the raw embedding array, handling both old and new data formats
function getEmbeddingVector(embeddingData: any): number[] | null {
	if (Array.isArray(embeddingData)) {
		if (embeddingData.length > 0 && typeof embeddingData[0] === 'number') {
			return embeddingData;
		}
		if (embeddingData.length > 0 && typeof embeddingData[0] === 'object' && embeddingData[0]?.embedding) {
			return embeddingData[0].embedding;
		}
	}
	return null;
}


export const POST: RequestHandler = async ({ request }) => {
	try {
		const { query: userQuery, mapName } = (await request.json()) as {
			query: string;
			mapName: string;
		};

		if (!userQuery || !mapName) {
			return json({ error: 'Missing query or mapName' }, { status: 400 });
		}
		console.log(`[Retriever] Searching for '${userQuery}' in map '${mapName}'`);

		// 1. Embed the user's query
		const queryEmbedding = await ai.embed({
			embedder: textEmbedding,
			content: userQuery
		});
		const queryVector = getEmbeddingVector(queryEmbedding);

		if (!queryVector) {
			throw new Error('Failed to generate a valid query embedding.');
		}
		
		console.log(`[Retriever] Query embedding (sample):`, queryVector.slice(0, 5));

		// 2. Load shapes and check for duplicate embeddings
		const db = getDb();
		const shapesCollectionRef = collection(db, 'maps', mapName, 'shapes');
		const q = query(shapesCollectionRef, where('description_embedding', '!=', null));
		const querySnapshot = await getDocs(q);
		
		const shapes = querySnapshot.docs.map(doc => doc.data() as ShapeData);
		console.log(`[Retriever] Found ${shapes.length} shapes with embedding field.`);

		// Diagnostic check for duplicate embeddings
		const embeddingHashes = new Set();
		let duplicateCount = 0;
		shapes.forEach(shape => {
			const vector = getEmbeddingVector(shape.description_embedding);
			if(vector && vector.length > 0) {
				const hash = vector.join(',');
				if (embeddingHashes.has(hash)) {
					duplicateCount++;
				}
				embeddingHashes.add(hash);
			}
		});
		if (duplicateCount > 0) {
			console.warn(`[Retriever] WARNING: Found ${duplicateCount} duplicate embeddings. This may be caused by short or non-descriptive content. Search results may be inaccurate.`);
		}

		// 3. Calculate similarities
		const similarities = shapes
			.map((shape) => {
				const docVector = getEmbeddingVector(shape.description_embedding);
				if (!docVector) return null;
				
				return {
					shape,
					similarity: cosineSimilarity(queryVector, docVector)
				};
			})
			.filter(Boolean);

		if (similarities.length === 0) {
			return json({ results: [] });
		}

		// 4. Sort by similarity and take top 3
		const topResults = similarities
			.sort((a, b) => b!.similarity - a!.similarity)
			.slice(0, 3)
			.map((result) => ({
				id: result!.shape.id,
				text: result!.shape.text,
				description: result!.shape.description,
				similarity: result!.similarity
			}));
		
		console.log(`[Retriever] Returning ${topResults.length} results.`);
		return json({ results: topResults });
	} catch (error: any) {
		console.error('Retriever API Error:', error.message);
		if (error.cause) {
			console.error('Underlying cause:', error.cause);
		}
		return json({ error: error.message, cause: error.cause }, { status: 500 });
	}
};
