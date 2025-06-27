// apps/web/app/(auth)/register/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false); // Used to prevent hydration mismatch
  const router = useRouter();

  useEffect(() => {
    setIsClient(true); // Set to true once on the client side
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      // This URL targets the Next.js API Route proxy for registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Registration failed. Please try again.');
        return;
      }

      const data = await response.json();
      setSuccessMessage(data.message || 'Registration successful! You can now log in.');
      setTimeout(() => {
        router.push('/login'); // Redirect to login after successful registration
      }, 2000);

    } catch (error) {
      console.error('Network or server error during registration:', error);
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render null on server or until client-side hydration for forms
  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-[#F2F2F2] flex items-center justify-center p-4">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-800">
        <h2 className="text-3xl font-bold text-center text-[#F2F2F2] mb-6">Register for NODA CoPilot</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#D9D9D9] mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-[#F2F2F2] focus:ring-[#8A0A0A] focus:border-[#8A0A0A] outline-none"
              placeholder="Choose a username"
              required
            />
          </div>
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
              placeholder="Enter your email"
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
              placeholder="Create a password"
              required
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-400 text-center">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="text-sm text-green-400 text-center">{successMessage}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#8A0A0A] text-[#F2F2F2] py-2 px-4 rounded-md font-semibold hover:bg-[#6B0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
          <p className="text-center text-sm text-[#D9D9D9] mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-[#8A0A0A] hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;