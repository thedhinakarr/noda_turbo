// apps/web/app/api/auth/login/route.ts
import { NextResponse } from 'next/server'; // Import NextResponse for redirection
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendLoginUrl = process.env.BACKEND_REST_API_BASE_URL + '/api/auth/login';

    const backendResponse = await fetch(backendLoginUrl, {
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
      console.error('Backend proxy error (login):', backendResponse.status, errorData);
      return new Response(JSON.stringify(errorData), {
        status: backendResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await backendResponse.json();
    console.log('[Login Proxy] Received data from backend:', data); // This log confirms token is present

    if (data.token) {
      const cookieStore = await cookies(); // Await cookies() to get the store instance
      
      cookieStore.set('authToken', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });

      // NEW: Redirect directly from the API route upon successful login & cookie set
      const redirectUrl = new URL('/', request.nextUrl.origin); // Target the dashboard
      return NextResponse.redirect(redirectUrl); // Send the redirect response

    } else {
      console.error('[Login Proxy] Backend response did not contain a "token" property after successful status:', data);
      return new Response(JSON.stringify({ message: 'Login successful, but no token received from backend.' }), {
        status: 401, // Unauthorized because token is missing from response body
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('API route /api/auth/login (proxy) caught an exception:', error);
    return new Response(JSON.stringify({ message: 'Internal server error in proxy' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}