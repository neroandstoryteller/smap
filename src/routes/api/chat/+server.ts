import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/admin';
import type { ShapeData } from '$lib/models/shapes';

const genAI = new GoogleGenerativeAI(env.AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

		// 2. 장소 정보를 컨텍스트 문자열로 만들기
		const shapesContext =
			'다음은 현재 장소에 대한 정보입니다:\n' +
			shapes
				.map((s) => `- 이름: ${s.text || '이름 없음'}, 설명: ${s.description || '설명 없음'}`)
				.join('\n');

		// 3. 대화 기록 및 컨텍스트 설정
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

		const prompt = `${shapesContext}\n\n위 정보를 바탕으로 다음 질문에 답해주세요:\n${lastMessage.text}`;

		const result = await chat.sendMessage(prompt);
		const response = await result.response;
		const text = response.text();

		return json({ text });
	} catch (e) {
		console.error('Chat API Error:', e);
		return json({ error: 'AI 응답 생성에 실패했습니다.' }, { status: 500 });
	}
};
