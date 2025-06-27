// apps/web/app/(auth)/login/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // NEW: Check if the response was a redirect
      if (response.redirected) {
        // If the API route successfully set the cookie and redirected,
        // we manually push the router to the new URL.
        router.push(response.url);
        return; // Exit early as redirection is handled
      }

      // Handle non-redirect responses (e.g., login failure, or unexpected success without redirect)
      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Login failed. Please check your credentials.');
        return;
      }

      // If we reach here, it means backendResponse.ok was true, but it wasn't a redirect.
      // This implies the backend login was successful, but the API route didn't redirect.
      // This scenario should ideally not happen if the API route is correctly returning NextResponse.redirect.
      // For robustness, we can still try to push to dashboard if we get here.
      console.log('Login successful, but no redirect response received from API route.');
      router.push('/'); // Fallback redirect to dashboard

    } catch (error) {
      console.error('Network or server error during login:', error);
      setErrorMessage('Could not connect to the server. Please try again.');
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-[#F2F2F2] flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-800">
        <h2 className="text-3xl font-bold text-center text-[#F2F2F2] mb-6">Login to NODA CoPilot</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#D9D9D9] mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-[#F2F2F2] focus:ring-[#8A0A0A] focus:border-[#8A0A0A] outline-none"
              placeholder="danny@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#D9D9D9] mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-[#F2F2F2] focus:ring-[#8A0A0A] focus:border-[#8A0A0A] outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-400 text-center">{errorMessage}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#8A0A0A] text-[#F2F2F2] py-2 px-4 rounded-md font-semibold hover:bg-[#6B0000] transition-colors"
          >
            Login
          </button>
          <p className="text-center text-sm text-[#D9D9D9] mt-4">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#8A0A0A] hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;