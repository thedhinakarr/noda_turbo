// apps/web/app/api/copilot-stream/route.ts

// Optional: Use the Edge Runtime for faster cold starts and efficient streaming.
export const runtime = 'edge'; 

export async function POST(req: Request) {
  try {
    // 1. Get the user's message from the request body sent by the frontend
    const { question } = await req.json(); 

    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ error: 'Question is required and must be a string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- 2. Call your actual backend endpoint ---
    const BACKEND_COPILOT_ENDPOINT = process.env.BACKEND_COPILOT_ENDPOINT || 'http://localhost:4000/api/copilot-stream';
    const BACKEND_API_TOKEN = process.env.BACKEND_API_TOKEN; // Your actual token from .env.local

    if (!BACKEND_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'Backend API token not configured.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const backendResponse = await fetch(BACKEND_COPILOT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BACKEND_API_TOKEN}`, // <--- Use your securely stored token here
      },
      body: JSON.stringify({ question }), // Forward the question to your backend
      // IMPORTANT: Set agent or follow for Node.js if your backend uses self-signed certs or needs specific http agent
    });

    // 3. Handle non-OK responses from your backend
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ message: 'Unknown error from backend' }));
      return new Response(JSON.stringify({ 
        error: `Backend error: ${backendResponse.status} - ${errorData.message || backendResponse.statusText}` 
      }), {
        status: backendResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- 4. Stream the backend's response directly to the frontend ---
    // This is highly efficient, directly piping the stream.
    return new Response(backendResponse.body, {
      headers: {
        // Match the Content-Type that your backend sends for the stream
        'Content-Type': backendResponse.headers.get('Content-Type') || 'text/plain', 
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Next.js API Route Error:', error);
    return new Response(JSON.stringify({ 
      error: `Internal server error in Copilot proxy: ${error instanceof Error ? error.message : String(error)}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}