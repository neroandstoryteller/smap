import { json, type RequestEvent } from '@sveltejs/kit';
import { configure } from '@genkit-ai/core';
import { defineFlow, runFlow, startFlowsServer } from '@genkit-ai/flow';
import { googleAI } from '@genkit-ai/googleai';
import { firebase } from '@genkit-ai/firebase'; // 올바른 임포트 경로
import { defineRetriever, Document, retrieve } from '@genkit-ai/ai/retriever';
import { z } from 'zod';
import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';

import { db } from '$lib/server/admin';
import { generateEmbedding } from '$lib/server/embedding';

// Genkit 설정
configure({
	plugins: [
		googleAI(),
		firebase()
	],
});

// 리트리버 설정을 위한 스키마 정의
const retrieverConfigSchema = z.object({
	mapName: z.string(),
	limit: z.number().optional().default(5)
});

// 커스텀 Firestore 리트리버 정의
const firestoreRetriever = defineRetriever(
	{
		name: 'smap-firestore-retriever',
		configSchema: retrieverConfigSchema
	},
	async (query: Document, options: z.infer<typeof retrieverConfigSchema>) => {
		const queryText = query.text; // .text는 속성이므로 ()를 제거합니다.
		if (!queryText) {
			return { documents: [] };
		}

		const { mapName, limit } = options;

		const queryEmbedding = await generateEmbedding(queryText);
		const shapesCollectionRef = (db as Firestore).collection(`maps/${mapName}/shapes`);

		const vectorQuery = (shapesCollectionRef as any).findNearest('description_embedding', queryEmbedding, {
			limit: limit,
			distanceMeasure: 'COSINE'
		});

		const snapshot = await vectorQuery.get();

		if (snapshot.empty) {
			return { documents: [] };
		}

		const documents = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
			const data = doc.data();
			const similarity = 1 - (doc as any).distance;

			return Document.fromText(data.description || '', {
				id: doc.id,
				text: data.text,
				description: data.description,
				similarity: isNaN(similarity) ? 0 : similarity
			});
		});

		return { documents };
	}
);

// 검색 Flow의 입출력 스키마 정의
const retrieverFlowInputSchema = z.object({
	query: z.string(),
	mapName: z.string()
});

const retrieverFlowOutputSchema = z.object({
	results: z.array(
		z.object({
			id: z.string().optional(),
			text: z.string().optional(),
			description: z.string().optional(),
			similarity: z.number()
		})
	)
});

// 메인 검색 Flow 정의
const retrieverFlow = defineFlow(
	{
		name: 'retrieverFlow',
		inputSchema: retrieverFlowInputSchema,
		outputSchema: retrieverFlowOutputSchema
	},
	async (input) => {
		const retrievedDocs = await retrieve({
			retriever: firestoreRetriever,
			query: input.query,
			options: {
				mapName: input.mapName,
				limit: 5
			}
		});

		const results = retrievedDocs.map((doc) => ({
			id: doc.metadata?.id,
			text: doc.metadata?.text,
			description: doc.metadata?.description,
			similarity: doc.metadata?.similarity || 0
		}));

		return { results };
	}
);

// SvelteKit POST 핸들러
export async function POST(event: RequestEvent) {
	try {
		const { query, mapName } = await event.request.json();

		if (!query || !mapName) {
			return json({ error: 'Query and mapName are required.' }, { status: 400 });
		}

		const flowResult = await runFlow(retrieverFlow, { query, mapName });

		return json(flowResult);
	} catch (error: any) {
		console.error('[Genkit Retriever API] An unexpected error occurred:', error);
		return json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
	}
}

// 로컬 개발용 Genkit UI 서버 시작
startFlowsServer();
