"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.redirected) {
        router.push(response.url);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Login failed. Please check your credentials.');
        return;
      }
      
      router.push('/');

    } catch (error) {
      console.error('Network or server error during login:', error);
      setErrorMessage('Could not connect to the server. Please try again.');
    }
  };

  if (!isClient) {
    return null; // Render nothing on the server to prevent hydration issues
  }

  return (
    // Use new theme colors and add a fade-in animation
    <div className="min-h-screen bg-background-dark text-text flex items-center justify-center p-4 animate-fade-in">
      {/* Use the lighter background for the panel */}
      <div className="bg-background-light p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-800">
        {/* Use the 'heading' font for the title */}
        <h2 className="text-3xl font-bold text-center text-text-light mb-6 font-heading">
          Login to NODA CoPilot
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Use theme colors for input fields and focus rings
              className="w-full px-4 py-2 bg-background-dark border border-gray-700 rounded-md text-text-light focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition"
              placeholder="danny@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-medium mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-background-dark border border-gray-700 rounded-md text-text-light focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition"
              placeholder="Enter your password"
              required
            />
          </div>

          {errorMessage && (
            // Use the 'status-alert' color for errors
            <p className="text-sm text-status-alert text-center">{errorMessage}</p>
          )}

          <button
            type="submit"
            // Use brand colors for the primary button
            className="w-full flex justify-center items-center gap-2 bg-brand-primary text-text-light py-2 px-4 rounded-md font-semibold hover:bg-brand-accent transition-colors"
          >
            <LogIn size={16} />
            Login
          </button>
          <p className="text-center text-sm text-text-medium mt-4">
            Don't have an account?{' '}
            {/* Use the brand accent color for links */}
            <Link href="/register" className="font-semibold text-brand-accent hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
