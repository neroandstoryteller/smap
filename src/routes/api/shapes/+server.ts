import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	doc,
	collection,
	getDocs,
	writeBatch,
	serverTimestamp
} from 'firebase/firestore';
import { getDb } from '$lib/database/firebase';
import { generateEmbedding } from '$lib/server/embedding';
import type { ShapeData } from '$lib/models/shapes';

function genId(): string {
	return `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export const GET: RequestHandler = async () => {
    const shapes = [
        {
            type: 'Rect',
            id: genId(),
            x: 90,
            y: 20,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '체력장'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 155,
            y: 20,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: 'wc(여)'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 220,
            y: 20,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '세면장'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 285,
            y: 20,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: 'wc(남)'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 350,
            y: 20,
            width: 60,
            height: 30,
            fill: '#D3D3D3',
            stroke: '#000000',
            strokeWidth: 1,
            text: '계단'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 10,
            y: 80,
            width: 70,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '음악실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 85,
            y: 80,
            width: 70,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '연습실4'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 160,
            y: 80,
            width: 70,
            height: 30,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-9'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 235,
            y: 80,
            width: 70,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '준비실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 310,
            y: 80,
            width: 70,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '미술실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 385,
            y: 80,
            width: 100,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '학생자치회실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 30,
            y: 200,
            width: 100,
            height: 40,
            fill: '#FFC0CB',
            stroke: '#000000',
            strokeWidth: 2,
            text: '5층'
        },
        {
            type: 'Circle',
            id: genId(),
            x: 160,
            y: 330,
            radius: 45,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-8'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 450,
            y: 170,
            width: 30,
            height: 40,
            fill: '#D3D3D3',
            stroke: '#000000',
            strokeWidth: 1,
            text: '서고'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 400,
            y: 240,
            width: 100,
            height: 30,
            fill: '#D3D3D3',
            stroke: '#000000',
            strokeWidth: 1,
            text: ''
        },
        {
            type: 'Rect',
            id: genId(),
            x: 530,
            y: 130,
            width: 100,
            height: 30,
            fill: '#ADD8E6',
            stroke: '#000000',
            strokeWidth: 1,
            text: '3학년부'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 530,
            y: 165,
            width: 50,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '발간실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 580,
            y: 165,
            width: 50,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '준비실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 530,
            y: 200,
            width: 100,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '교사휴게실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 640,
            y: 240,
            width: 60,
            height: 30,
            fill: '#D3D3D3',
            stroke: '#000000',
            strokeWidth: 1,
            text: '미디어공간'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 705,
            y: 240,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: 'wc(교사)'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 770,
            y: 240,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: 'wc(여)'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 835,
            y: 240,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: '세면장'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 900,
            y: 240,
            width: 60,
            height: 30,
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 1,
            text: 'wc(남)'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 965,
            y: 240,
            width: 60,
            height: 30,
            fill: '#D3D3D3',
            stroke: '#000000',
            strokeWidth: 1,
            text: '계단'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 260,
            y: 320,
            width: 80,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '다목적실'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 345,
            y: 320,
            width: 120,
            height: 40,
            fill: '#ADD8E6',
            stroke: '#000000',
            strokeWidth: 2,
            text: '인문사회부'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 470,
            y: 320,
            width: 120,
            height: 40,
            fill: '#ADD8E6',
            stroke: '#000000',
            strokeWidth: 2,
            text: '미래교육과정부'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 600,
            y: 320,
            width: 70,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-7'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 675,
            y: 320,
            width: 70,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-6'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 750,
            y: 320,
            width: 70,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-5'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 825,
            y: 320,
            width: 70,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-4'
        },
        {
            type: 'Rect',
            id: genId(),
            x: 900,
            y: 320,
            width: 70,
            height: 40,
            fill: '#FFFF00',
            stroke: '#000000',
            strokeWidth: 2,
            text: '3-3'
        }
    ];
	return json(shapes);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { mapName, shapes: newShapes } = (await request.json()) as { mapName: string; shapes: ShapeData[] };

		if (!mapName || !newShapes) {
			return json({ error: 'Missing mapName or shapes' }, { status: 400 });
		}

		const db = getDb();
		const shapesCollectionRef = collection(db, 'maps', mapName, 'shapes');

		// 1. Get existing shapes
		const querySnapshot = await getDocs(shapesCollectionRef);
		const existingShapesMap = new Map<string, ShapeData>();
		querySnapshot.forEach(doc => {
			existingShapesMap.set(doc.id, doc.data() as ShapeData);
		});

		// 2. Generate embeddings for each shape
		const embeddingPromises = newShapes.map(async (shape) => {
			const existingShape = existingShapesMap.get(shape.id);

			const currentContent = `${shape.text || ''}: ${shape.description || '내용 없음'}`;
			console.log(`[DEBUG] For Shape ID ${shape.id}, currentContent is: "${currentContent}"`);
			const existingContent = existingShape ? `${existingShape.text || ''}: ${existingShape.description || '내용 없음'}` : null;

			const needsEmbedding = !existingShape || currentContent !== existingContent || !existingShape.description_embedding;

			if (needsEmbedding) {
				console.log(`[Embedding] Generating for shape ID: ${shape.id}, Content: "${currentContent}"`);
				// Use the combined 'currentContent' for embedding
				const embedding = await generateEmbedding(currentContent);
				console.log(`[Embedding] Result (sample) for ${shape.id}:`, embedding.slice(0, 5));
				return {
					...shape,
					description_embedding: embedding,
					description_edited_at: serverTimestamp()
				};
			} else {
				// IMPORTANT: Preserve existing embedding if no change is needed
				return {
					...shape,
					description_embedding: existingShape.description_embedding,
					description_edited_at: existingShape.description_edited_at
				};
			}
		});

		const shapesToSave = await Promise.all(embeddingPromises);

		// 3. Batch write all changes
		const batch = writeBatch(db);
		const newShapeIds = new Set(newShapes.map((s) => s.id));

		for (const shape of shapesToSave) {
			const shapeDocRef = doc(db, 'maps', mapName, 'shapes', shape.id);
			batch.set(shapeDocRef, shape, { merge: true });
		}

		for (const id of existingShapesMap.keys()) {
			if (!newShapeIds.has(id)) {
				const shapeDocRef = doc(db, 'maps', mapName, 'shapes', id);
				batch.delete(shapeDocRef);
			}
		}

		await batch.commit();

		return json({ success: true, updatedCount: shapesToSave.length });

	} catch (error: any) {
		console.error('API Error in /api/shapes:', error);
		return json({ error: 'Failed to save shapes.', details: error.message }, { status: 500 });
	}
};
