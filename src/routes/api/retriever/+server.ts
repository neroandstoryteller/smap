// src/routes/api/retriever/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ai, textEmbedding } from '$lib/genkit';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '$lib/database/firestore';
import type { ShapeData } from '$lib/models/shapes';

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
	if (vecA.length !== vecB.length) {
		return 0;
	}
	const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
	const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
	const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
	if (magA === 0 || magB === 0) {
		return 0;
	}
	return dotProduct / (magA * magB);
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

		// 1. Embed the user's query
		const queryEmbedding = await ai.embed({ // Use the ai instance
			embedder: textEmbedding,
			content: userQuery
		});

		// 2. Load all shapes for the map
		const docRef = doc(db, 'mapName', mapName);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return json({ error: 'Map not found' }, { status: 404 });
		}

		const allShapes: ShapeData[] = docSnap.data().shapes || [];

		// 3. Filter shapes that have an embedding
		const shapesWithEmbeddings = allShapes.filter(
			(shape) => shape.description_embedding && Array.isArray(shape.description_embedding)
		);

		// 4. Calculate similarities
		const similarities = shapesWithEmbeddings.map((shape) => ({
			shape,
			similarity: cosineSimilarity(queryEmbedding, shape.description_embedding!)
		}));

		// 5. Sort by similarity and take top 3
		const topResults = similarities
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, 3)
			.map((result) => ({
				id: result.shape.id,
				text: result.shape.text,
				description: result.shape.description,
				similarity: result.similarity
			}));

		return json({ results: topResults });
	} catch (error: any) {
		console.error('Retriever API Error:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
