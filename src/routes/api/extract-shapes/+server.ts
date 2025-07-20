import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

function genId(): string {
	return `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// 환경 변수에서 API 키를 가져옵니다.
const genAI = new GoogleGenerativeAI(env.AI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

const generationConfig = {
    responseMimeType: "application/json",
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File;

        if (!imageFile) {
            return json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
        }

        const imageBuffer = await imageFile.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        
        const prompt = `
System:
당신은 다이어그램 안의 도형(Rect, Circle)만을 감지해서 JavaScript 객체 배열 형태로 출력하는 shape-extractor 역할을 합니다.  
출력 형식은 반드시 아래 예시와 같아야 합니다:

\`\`\`json
[
    {
        "type": "Rect",
        "id": "genId()",
        "x": 150,
        "y": 150,
        "width": 120,
        "height": 90,
        "fill": "#89CFF0",
        "stroke": "#000000",
        "strokeWidth": 2,
        "text": "글자를 둘 수 있습니다."
    },
    {
        "type": "Circle",
        "id": "genId()",
        "x": 300,
        "y": 100,
        "radius": 40,
        "fill": "#90EE90",
        "stroke": "#000000",
        "strokeWidth": 2,
        "text": "text here!"
    }
]
\`\`\`

id 필드는 "genId()" 문자열을 그대로 사용해야 합니다. 
fill, stroke, strokeWidth 같은 스타일 속성은 적절히 판단하여 채워주세요.
        `;

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: imageFile.type,
            },
        };

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [imagePart, { text: prompt }] }],
            generationConfig,
        });

        const responseText = result.response.text();
        // Gemini가 반환한 JSON 문자열에서 genId()를 실제 함수 호출로 바꿉니다.
        // 이 방법은 보안상 위험할 수 있으므로 실제 프로덕션에서는 더 안전한 파싱 방법을 사용해야 합니다.
        const shapes = JSON.parse(responseText.replace(/"id": "genId\(\)"/g, `"id": "${genId()}"`));

        return json({ shapes });

    } catch (e) {
        console.error(e);
        return json({ error: '도형 추출에 실패했습니다.' }, { status: 500 });
    }
}; 