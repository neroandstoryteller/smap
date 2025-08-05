import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/admin';
import type { ShapeData } from '$lib/models/shapes';

const genAI = new GoogleGenerativeAI(env.AI_API_KEY);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { history, mapName } = await request.json();

		if (!history || !Array.isArray(history) || history.length === 0) {
			return json({ error: '채팅 기록이 올바르지 않습니다.' }, { status: 400 });
		}

		if (!mapName) {
			return json({ error: 'mapName이 필요합니다.' }, { status: 400 });
		}

		// 1. Firestore에서 장소 정보 가져오기
		const shapesCollectionRef = db.collection('maps').doc(mapName).collection('shapes');
		const querySnapshot = await shapesCollectionRef.get();
		const shapes: ShapeData[] = [];
		querySnapshot.forEach((doc) => {
			shapes.push(doc.data() as ShapeData);
		});

		// 2. 시스템 프롬프트(도구 및 장소 정보 포함) 구성
		const placeListForPrompt = shapes
			.map((s) => `- 이름: ${s.text || '이름 없음'}, 설명: ${s.description || '설명 없음'}`)
			.join('\n');

		const systemInstruction = `당신은 사용자가 지도에서 장소를 찾는 것을 도와주는 AI 어시스턴트입니다.
사용자가 특정 장소의 위치를 물어보거나, 그 장소로 안내해달라고 요청하면(예: "체력장은 어디야?", "3-9반으로 가줘"), 당신의 답변은 반드시 'map?selectShapeName=<장소이름>' 형식이어야 합니다.
'<장소이름>' 부분은 아래 목록에 있는 정확한 이름으로 바꿔야 합니다. 응답에 다른 텍스트, 설명, 인사를 절대 추가하지 마세요.

만약 사용자의 질문이 특정 장소를 찾는 것이 아니라면, 아래 정보를 바탕으로 자연스럽게 대화하세요.

[장소 정보]
${placeListForPrompt}
---
`;

		const model = genAI.getGenerativeModel({
			model: 'gemini-1.5-flash',
			systemInstruction: systemInstruction
		});

		// 3. 대화 기록 설정
		const lastMessage = history[history.length - 1];
		let chatContext = history.slice(0, -1);

		if (chatContext.length > 0 && chatContext[0].sender === 'ai') {
			chatContext = chatContext.slice(1);
		}

		const geminiHistory = chatContext.map((msg: { sender: string; text: string }) => ({
			role: msg.sender === 'user' ? 'user' : 'model',
			parts: [{ text: msg.text }]
		}));

		// 4. AI 모델에 프롬프트 전달
		const chat = model.startChat({
			history: geminiHistory
		});

		const result = await chat.sendMessage(lastMessage.text);
		const response = await result.response;
		const text = response.text();

		return json({ text });
	} catch (e) {
		console.error('Chat API Error:', e);
		return json({ error: 'AI 응답 생성에 실패했습니다.' }, { status: 500 });
	}
};
