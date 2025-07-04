// apps/web/components/dashboard/DashboardPageHeader.tsx
"use client"; // This component needs client-side hooks

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation'; // Hook to get current route
import { Sun, Moon, Bot } from 'lucide-react'; // Icons for theme and Copilot
import { useCopilot } from '@/context/CopilotContext'; // Context for Copilot toggle

export default function DashboardPageHeader() {
  const pathname = usePathname(); // Get the current URL path
  const { isCopilotOpen, setCopilotOpen } = useCopilot(); // Copilot state from context

  const handleThemeToggle = () => {
    document.documentElement.classList.toggle('light');
    document.documentElement.classList.toggle('dark');
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
    <header className="w-full border-b border-border border-border-tertiary mb-3">
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
            <Sun className="h-5 w-5 hidden light:block" />
            <Moon className="h-5 w-5 block light:hidden" />
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