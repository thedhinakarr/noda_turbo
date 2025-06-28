"use client";

import React from 'react';
import { signIn } from 'next-auth/react';
import { LogIn } from 'lucide-react'; // We can use an icon for the button

const LoginPage = () => {

  // The handleLogin function now calls the signIn function from Auth.js
  const handleLogin = () => {
    // This tells Auth.js to use the "azure-ad" provider we configured.
    // After a successful login, the user will be redirected to the root dashboard page.
    signIn('azure-ad', { callbackUrl: '/' });
  };

  return (
    // Use our theme colors and a fade-in animation for a polished look
    <div className="min-h-screen bg-background-dark text-text flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-background-light p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-800 text-center">
        {/* Use the heading font for the title */}
        <h2 className="text-3xl font-bold text-text-light mb-4 font-heading">
          NODA CoPilot
        </h2>
        <p className="text-text-medium mb-8">
          Please log in with your corporate account to continue.
        </p>
        
        {/* The new, single login button */}
        <button
          onClick={handleLogin}
          // Use our brand colors for the primary action button
          className="w-full flex justify-center items-center gap-3 bg-brand-primary text-text-light py-3 px-4 rounded-md font-semibold hover:bg-brand-accent transition-colors"
        >
          <LogIn size={18} />
          Login with Microsoft
        </button>

        {/* We no longer need the "Don't have an account?" link, as registration is handled by the organization */}
      </div>
    </div>
  );
};

export default LoginPage;
