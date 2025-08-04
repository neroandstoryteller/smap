import type { RequestHandler } from '@sveltejs/kit';
import { initializeGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { generate } from '@genkit-ai/ai';
import * as z from 'zod';

// Genkit 초기화
initializeGenkit({
  plugins: [googleAI({ apiKey: process.env.AI_API_KEY })],
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { prompt } = await request.json();
    const response = await generate({
      model: 'gemini-pro', // Gemini Pro 모델 사용
      prompt,
    });
    return new Response(JSON.stringify({ text: response.text() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};