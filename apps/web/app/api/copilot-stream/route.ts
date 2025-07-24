import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Remove: export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { newMessage, history, sessionId } = body;

    if (!newMessage || !sessionId) {
      return NextResponse.json({ error: 'newMessage and sessionId are required' }, { status: 400 });
    }

    const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:5001/chat';

    const llmResponse = await fetch(LLM_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: newMessage,
        session_id: sessionId,
        history: history || [],
      }),
    });

    if (!llmResponse.ok) {
      const errorBody = await llmResponse.text();
      console.error(`LLM service error: ${llmResponse.status}`, errorBody);
      return NextResponse.json({ error: `LLM service failed: ${errorBody}` }, { status: llmResponse.status });
    }

    const data = await llmResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in copilot API route:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}