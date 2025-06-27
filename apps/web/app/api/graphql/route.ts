// apps/web/app/api/graphql/route.ts
import { cookies } from 'next/headers';

const getBackendGraphQLUrl = () => {
  const backendUrl = process.env.BACKEND_GRAPHQL_API_URL || 'http://localhost:4000/api/graphql';
  console.log(`[GraphQL Proxy] Using backend URL: ${backendUrl}`);
  return backendUrl;
};

export async function POST(request: Request) {
  try {
    const backendGraphQLUrl = getBackendGraphQLUrl();
    const headers = new Headers(request.headers);

    // FIX APPLIED HERE: Explicitly await the cookies() call
    const cookieStore = await cookies(); // <--- ENSURE 'await' IS HERE
    const authToken = cookieStore.get('authToken')?.value;

    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
      console.log('[GraphQL Proxy] Set Authorization header from cookie.');
    } else {
      console.log('[GraphQL Proxy] No authToken cookie found for Authorization header.');
      headers.delete('Authorization');
    }

    headers.set('Content-Type', 'application/json');
    headers.delete('host');
    headers.delete('connection');

    const requestBody = await request.json();
    console.log('[GraphQL Proxy] Forwarding GraphQL query:', JSON.stringify(requestBody, null, 2));

    const backendResponse = await fetch(backendGraphQLUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    console.log(`[GraphQL Proxy] Backend responded with status: ${backendResponse.status}`);

    if (!backendResponse.ok) {
        const errorResponseBody = await backendResponse.text();
        console.error(`[GraphQL Proxy] Backend returned non-OK status (${backendResponse.status}). Response body: ${errorResponseBody}`);
        return new Response(errorResponseBody, {
            status: backendResponse.status,
            statusText: backendResponse.statusText,
            headers: backendResponse.headers,
        });
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: backendResponse.headers,
    });

  } catch (error) {
    console.error('API route /api/graphql (proxy POST) caught an exception:', error);
    return new Response(
      JSON.stringify({ errors: [{ message: `GraphQL proxy error (POST): ${error.message}` }] }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET(request: Request) { // Assuming this is also in your file
  try {
    const backendGraphQLUrl = getBackendGraphQLUrl();
    const headers = new Headers(request.headers);

    // Also add cookie handling for GET requests if they might be authenticated
    const cookieStore = await cookies(); // <--- ENSURE 'await' IS HERE for GET
    const authToken = cookieStore.get('authToken')?.value;
    if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
    } else {
        headers.delete('Authorization');
    }

    headers.delete('host');
    headers.delete('connection');

    const url = new URL(request.url);
    const backendUrlWithParams = new URL(backendGraphQLUrl);
    url.searchParams.forEach((value, key) => {
      backendUrlWithParams.searchParams.append(key, value);
    });

    const backendResponse = await fetch(backendUrlWithParams.toString(), {
      method: 'GET',
      headers: headers,
    });

    console.log(`[GraphQL Proxy GET] Backend responded with status: ${backendResponse.status}`);

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: backendResponse.headers,
    });

  } catch (error) {
    console.error('API route /api/graphql (proxy GET) caught an exception:', error);
    return new Response(
      JSON.stringify({ errors: [{ message: `GraphQL proxy error (GET): ${error.message}` }] }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}