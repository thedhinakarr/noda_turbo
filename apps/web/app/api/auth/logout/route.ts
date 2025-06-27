// apps/web/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Import cookies helper

export async function POST() {
  try {
    // FIX APPLIED HERE: Explicitly AWAIT the cookies() function call for deleting the cookie
    const cookieStore = await cookies(); // <--- THIS IS THE CRUCIAL CHANGE
    
    // Now use the awaited cookieStore instance to delete the cookie
    cookieStore.delete('authToken'); // <--- Call .delete() on the awaited store

    console.log('[Logout Proxy] authToken cookie deleted.'); // Confirmation log

    return new Response(JSON.stringify({ message: 'Logout successful' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API route /api/auth/logout error:', error);
    return new Response(JSON.stringify({ message: 'Failed to logout' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}