"use client";

import React from 'react';
import { signIn } from 'next-auth/react';
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  // We will force the correct scope directly in the signIn call.
  const handleLogin = () => {
    const clientId = "29a528ea-f58d-49fe-9da8-fbb53a839d55"; // Your App's Client ID
    const customScope = `api://${clientId}/access_as_user openid profile email`;

    // The third argument to signIn is an object for authorization parameters.
    // We are forcing the scope here to bypass any configuration caching issues.
    signIn('azure-ad', { callbackUrl: '/' }, { scope: customScope });
  };

  return (
    <div className="min-h-screen bg-background-dark text-text flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-background-light p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-800 text-center">
        <h2 className="text-3xl font-bold text-text-light mb-4 font-heading">
          NODA CoPilot
        </h2>
        <p className="text-text-medium mb-8">
          Please log in with your corporate account to continue.
        </p>
        
        <button
          onClick={handleLogin}
          className="w-full flex justify-center items-center gap-3 bg-brand-primary text-text-light py-3 px-4 rounded-md font-semibold hover:bg-brand-accent transition-colors"
        >
          <LogIn size={18} />
          Login with Microsoft
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
