// apps/web/app/api/auth/register/route.ts
import { NextResponse } from 'next/server'; // Import NextResponse

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendRegisterUrl = process.env.BACKEND_REST_API_BASE_URL + '/api/auth/register';

    const backendResponse = await fetch(backendRegisterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // @ts-ignore
      duplex: 'half'
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('Backend register proxy error:', backendResponse.status, errorData);
      return new Response(JSON.stringify(errorData), {
        status: backendResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await backendResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API route /api/auth/register (proxy) caught an exception:', error);
    return new Response(JSON.stringify({ message: 'Internal server error in proxy' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}