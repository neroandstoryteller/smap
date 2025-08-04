import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

// .env 파일에 정의된 API 키를 사용합니다.
const genAI = new GoogleGenerativeAI(env.AI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { history } = await request.json();

        if (!history || !Array.isArray(history) || history.length === 0) {
            return json({ error: '채팅 기록이 올바르지 않습니다.' }, { status: 400 });
        }

        // Gemini API가 요구하는 형식으로 변환합니다.
        // 대화 기록의 마지막 메시지는 현재 사용자의 프롬프트입니다.
        const lastMessage = history[history.length - 1];

        // 컨텍스트는 마지막 메시지를 제외한 나머지입니다.
        let chatContext = history.slice(0, -1);

        // 만약 컨텍스트의 첫 메시지가 AI의 인사말이라면, 히스토리에서 제외합니다.
        if (chatContext.length > 0 && chatContext[0].sender === 'ai') {
            chatContext = chatContext.slice(1);
        }

        const geminiHistory = chatContext.map((msg: { sender: string; text: string; }) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const chat = model.startChat({
            history: geminiHistory,
        });

        // 실제 프롬프트는 마지막 메시지의 텍스트입니다.
        const result = await chat.sendMessage(lastMessage.text);
        const response = await result.response;
        const text = response.text();

        return json({ text });

    } catch (e) {
        console.error('Chat API Error:', e);
        return json({ error: 'AI 응답 생성에 실패했습니다.' }, { status: 500 });
    }
};
