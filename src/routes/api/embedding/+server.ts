// src/routes/api/embedding/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ai, textEmbedding } from '$lib/genkit';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '$lib/database/firestore';
import type { ShapeData } from '$lib/models/shapes';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { mapName, shapes: newShapes } = (await request.json()) as {
			mapName: string;
			shapes: ShapeData[];
		};

		if (!mapName || !newShapes) {
			return json({ error: 'Missing mapName or shapes' }, { status: 400 });
		}

		const docRef = doc(db, 'mapName', mapName);
		const docSnap = await getDoc(docRef);
		const existingShapes: ShapeData[] = docSnap.exists() ? docSnap.data().shapes || [] : [];

		const shapesToUpdate = newShapes.filter((newShape) => {
			if (!newShape.description) return false;
			const existingShape = existingShapes.find((s) => s.id === newShape.id);
			if (!existingShape) return true;
			return newShape.description !== existingShape.description || !existingShape.description_embedding;
		});

		const embeddingPromises = shapesToUpdate.map(async (shape) => {
			if (shape.description) {
				const embedding = await ai.embed({ // Use the ai instance
					embedder: textEmbedding,
					content: shape.description
				});
				return {
					...shape,
					description_embedding: embedding,
					description_edited_at: serverTimestamp()
				};
			}
			return shape;
		});

		const shapesWithEmbeddings = await Promise.all(embeddingPromises);

		const updatedShapesMap = new Map(shapesWithEmbeddings.map((s) => [s.id, s]));

		const finalShapes = newShapes.map((newShape) => {
			return updatedShapesMap.get(newShape.id) || newShape;
		});

		const finalShapeIds = new Set(finalShapes.map((s) => s.id));
		existingShapes.forEach((existingShape) => {
			if (!finalShapeIds.has(existingShape.id)) {
				finalShapes.push(existingShape);
			}
		});

		await setDoc(docRef, { shapes: finalShapes }, { merge: true });

		return json({ success: true, updated: shapesToUpdate.length });
	} catch (error: any) {
		console.error('Embedding API Error:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
