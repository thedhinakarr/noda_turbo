// apps/web/components/dashboard/DashboardPageHeader.tsx
"use client"; // This component needs client-side hooks

import React, { useMemo, useState, useEffect } from 'react'; // <--- Import useState and useEffect
import { usePathname } from 'next/navigation'; // Hook to get current route
import { SunMedium, Moon, Bot } from 'lucide-react'; // Icons for theme and Copilot
import { useCopilot } from '@/context/CopilotContext'; // Context for Copilot toggle

export default function DashboardPageHeader() {
  const pathname = usePathname(); // Get the current URL path
  const { isCopilotOpen, setCopilotOpen } = useCopilot(); // Copilot state from context

  // 1. Manage theme state in React
  // Initialize theme from the <html> element's class on mount, or default to 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check if window is defined (to run only on client-side)
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('light') ? 'light' : 'dark';
    }
    return 'dark'; // Default to dark during server-side rendering
  });

  // 2. Use useEffect to synchronize React state with document.documentElement class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else { // theme is 'light'
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    // Optional: You can also save the theme preference to localStorage here
    // localStorage.setItem('theme', theme);
  }, [theme]); // This effect runs whenever the 'theme' state changes

  const handleThemeToggle = () => {
    // 3. Toggle theme state in React
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const handleToggleCopilot = () => {
    setCopilotOpen(prev => !prev); // Toggle Copilot visibility
  };

  // Derive the page title from the current pathname
  const pageTitle = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean); // Split by '/' and remove empty strings
    if (segments.length === 0) {
      return 'Overview'; // Default title for the root dashboard path '/'
    }
    // Capitalize the first letter of the last segment (e.g., "/building" -> "Building")
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  }, [pathname]); // Re-calculate when pathname changes

  return (
    <header className="w-full border-b border-border mb-3">
      <div className="flex justify-between items-center px-4 py-3"> 
        <div>
          <h1 className="text-xl font-bold text-text-primary">{pageTitle}</h1> {/* Dynamic page title */}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-full hover:bg-background-card text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Toggle theme"
          >
            {/* 4. Conditionally render the icon based on the 'theme' state */}
            {theme === 'dark' ? (
              <SunMedium className="h-5 w-5" /> // Show Sun icon when current theme is dark
            ) : (
              <Moon className="h-5 w-5" /> // Show Moon icon when current theme is light
            )}
          </button>
          {/* Copilot Toggle Icon Button */}
          <button
            onClick={handleToggleCopilot}
            className={`p-2 rounded-full text-text-secondary transition-colors
              ${isCopilotOpen ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-background-card hover:text-text-primary'}`}
            aria-label={isCopilotOpen ? "Hide Copilot" : "Show Copilot"}
          >
            <Bot className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}